#!/usr/bin/env python3
"""
QGEN_IMPFRAG IFC Processor - Stage 1 Backend
============================================

Main IFC processing module that handles:
1. IFC file import and validation
2. Conversion to fragments format using ThatOpen Components
3. Storage and organization of output files
4. API endpoints for frontend integration
5. File monitoring and automatic processing

This module integrates with the existing frag_convert utilities
while providing a web API interface for the frontend viewer.

Usage:
    python ifc_processor.py [OPTIONS]

Options:
    --dev           Run in development mode with debug logging
    --watch         Monitor IFC directory for new files
    --convert       Convert all IFC files immediately and exit
    --port PORT     Specify API server port (default: 8000)

Author: XQG4_AXIS Team
Version: 1.0.0
"""

import os
import sys
import json
import time
import logging
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any
import subprocess
import shutil

# Web framework imports
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import click

# File monitoring
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration and validation
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

# Add the current directory to Python path for local imports
BACKEND_DIR = Path(__file__).parent.parent
sys.path.append(str(BACKEND_DIR))

# Node.js converter integration
CONVERTER_SCRIPT = BACKEND_DIR / "ifc_converter.js"


class Config(BaseSettings):
    """Application configuration with environment variable support"""
    
    # Directories
    project_root: Path = Path("/data/XVUE/XQG4_AXIS/QGEN_IMPFRAG")
    ifc_input_dir: Path = Field(default_factory=lambda: Path("/data/XVUE/XQG4_AXIS/QGEN_IMPFRAG/data/ifc"))
    fragments_output_dir: Path = Field(default_factory=lambda: Path("/data/XVUE/XQG4_AXIS/QGEN_IMPFRAG/data/fragments"))
    logs_dir: Path = Field(default_factory=lambda: Path("/data/XVUE/XQG4_AXIS/QGEN_IMPFRAG/backend/logs"))
    reports_dir: Path = Field(default_factory=lambda: Path("/data/XVUE/XQG4_AXIS/QGEN_IMPFRAG/data/reports"))
    
    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # Processing options
    watch_enabled: bool = False
    auto_convert: bool = True
    max_file_size_mb: int = 500
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_prefix = "QGEN_IMPFRAG_"


class ConversionRequest(BaseModel):
    """Request model for IFC conversion"""
    filename: str
    force_reconvert: bool = False
    output_filename: Optional[str] = None


class ConversionStatus(BaseModel):
    """Response model for conversion status"""
    filename: str
    status: str  # pending, processing, completed, failed
    progress: float = 0.0
    message: str = ""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    output_file: Optional[str] = None
    compression_ratio: Optional[float] = None
    file_size_mb: Optional[float] = None


class IfcFileHandler(FileSystemEventHandler):
    """File system event handler for automatic IFC processing"""
    
    def __init__(self, processor):
        self.processor = processor
        self.logger = logging.getLogger(__name__)
    
    def on_created(self, event):
        if not event.is_dir and event.src_path.lower().endswith('.ifc'):
            self.logger.info(f"📁 New IFC file detected: {event.src_path}")
            # Add a small delay to ensure file is fully written
            time.sleep(2)
            self.processor.convert_file(Path(event.src_path))
    
    def on_modified(self, event):
        if not event.is_dir and event.src_path.lower().endswith('.ifc'):
            self.logger.info(f"📝 IFC file modified: {event.src_path}")
            time.sleep(2)
            self.processor.convert_file(Path(event.src_path))


class QgenImpfragProcessor:
    """Main processor class for IFC to fragments conversion"""
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = self._setup_logging()
        self.conversion_status: Dict[str, ConversionStatus] = {}
        self.setup_directories()
        
        # Initialize Flask app
        self.app = Flask(__name__)
        CORS(self.app)
        self.setup_routes()
        
        # File watcher
        self.observer = None
        if config.watch_enabled:
            self.setup_file_watcher()
    
    def _setup_logging(self) -> logging.Logger:
        """Configure logging for the processor"""
        self.config.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # File handler
        log_file = self.config.logs_dir / f"ifc_processor_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        
        # Setup logger
        logger = logging.getLogger(__name__)
        logger.setLevel(getattr(logging, self.config.log_level))
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def setup_directories(self):
        """Create necessary directories"""
        directories = [
            self.config.ifc_input_dir,
            self.config.fragments_output_dir,
            self.config.logs_dir,
            self.config.reports_dir
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"📁 Ensured directory exists: {directory}")
    
    def setup_file_watcher(self):
        """Setup file system monitoring for automatic processing"""
        self.observer = Observer()
        event_handler = IfcFileHandler(self)
        self.observer.schedule(
            event_handler, 
            str(self.config.ifc_input_dir), 
            recursive=False
        )
        self.logger.info(f"👀 File watcher configured for: {self.config.ifc_input_dir}")
    
    def setup_routes(self):
        """Configure Flask API routes"""
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "service": "qgen-impfrag-backend"
            })
        
        @self.app.route('/api/files', methods=['GET'])
        def list_files():
            """List available IFC files and their conversion status"""
            files = []
            for ifc_file in self.config.ifc_input_dir.glob("*.ifc"):
                fragment_file = self.config.fragments_output_dir / f"{ifc_file.stem}.frag"
                files.append({
                    "filename": ifc_file.name,
                    "size_mb": round(ifc_file.stat().st_size / (1024 * 1024), 2),
                    "modified": datetime.fromtimestamp(ifc_file.stat().st_mtime).isoformat(),
                    "has_fragments": fragment_file.exists(),
                    "fragment_size_mb": round(fragment_file.stat().st_size / (1024 * 1024), 2) if fragment_file.exists() else None,
                    "status": self.conversion_status.get(ifc_file.name, ConversionStatus(filename=ifc_file.name, status="ready")).status
                })
            return jsonify(files)
        
        @self.app.route('/api/convert', methods=['POST'])
        def convert_file_endpoint():
            """Convert a specific IFC file to fragments"""
            data = request.get_json()
            req = ConversionRequest(**data)
            
            ifc_file = self.config.ifc_input_dir / req.filename
            if not ifc_file.exists():
                return jsonify({"error": f"File not found: {req.filename}"}), 404
            
            # Start conversion in background
            result = self.convert_file(ifc_file, req.force_reconvert, req.output_filename)
            return jsonify(result.dict())
        
        @self.app.route('/api/status/<filename>', methods=['GET'])
        def get_conversion_status(filename):
            """Get conversion status for a specific file"""
            if filename in self.conversion_status:
                return jsonify(self.conversion_status[filename].dict())
            return jsonify({"error": "File not found"}), 404
        
        @self.app.route('/api/fragments/<filename>', methods=['GET'])
        def download_fragment(filename):
            """Download a fragments file"""
            fragment_file = self.config.fragments_output_dir / filename
            if fragment_file.exists():
                return send_file(fragment_file, as_attachment=True)
            return jsonify({"error": "Fragment file not found"}), 404
    
    def convert_file(self, ifc_file: Path, force_reconvert: bool = False, output_filename: str = None) -> ConversionStatus:
        """Convert a single IFC file to fragments format"""
        filename = ifc_file.name
        output_filename = output_filename or f"{ifc_file.stem}.frag"
        output_file = self.config.fragments_output_dir / output_filename
        
        # Check if already converted
        if output_file.exists() and not force_reconvert:
            self.logger.info(f"✅ Fragment already exists for {filename}, skipping conversion")
            status = ConversionStatus(
                filename=filename,
                status="completed",
                progress=100.0,
                message="Already converted",
                output_file=output_filename
            )
            self.conversion_status[filename] = status
            return status
        
        # Initialize status
        status = ConversionStatus(
            filename=filename,
            status="processing",
            start_time=datetime.now(),
            message="Starting conversion..."
        )
        self.conversion_status[filename] = status
        
        try:
            self.logger.info(f"🔄 Starting conversion of {filename}")
            
            # Use the Node.js converter script
            cmd = [
                "node", 
                str(CONVERTER_SCRIPT),
                "--input", str(ifc_file),
                "--output", str(output_file)
            ]
            
            self.logger.info(f"Running converter: {' '.join(cmd)}")
            
            # Run the Node.js converter
            result = subprocess.run(
                cmd,
                cwd=str(BACKEND_DIR),
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                error_msg = result.stderr.strip() or result.stdout.strip() or "Unknown conversion error"
                raise Exception(f"Converter failed: {error_msg}")
            
            self.logger.info(f"Converter output: {result.stdout.strip()}")
            
            # Check if conversion was successful
            if output_file.exists():
                # Calculate compression ratio
                original_size = ifc_file.stat().st_size
                fragment_size = output_file.stat().st_size
                compression_ratio = (1 - fragment_size / original_size) * 100
                
                status.status = "completed"
                status.progress = 100.0
                status.end_time = datetime.now()
                status.output_file = output_filename
                status.compression_ratio = round(compression_ratio, 2)
                status.file_size_mb = round(fragment_size / (1024 * 1024), 2)
                status.message = f"Conversion completed successfully. Compression: {compression_ratio:.1f}%"
                
                self.logger.info(f"✅ Successfully converted {filename} (compression: {compression_ratio:.1f}%)")
            else:
                raise Exception("Conversion completed but output file not found")
        
        except Exception as e:
            self.logger.error(f"❌ Conversion failed for {filename}: {str(e)}")
            status.status = "failed"
            status.end_time = datetime.now()
            status.message = f"Conversion failed: {str(e)}"
        
        self.conversion_status[filename] = status
        return status
    
    def convert_all_files(self):
        """Convert all IFC files in the input directory"""
        ifc_files = list(self.config.ifc_input_dir.glob("*.ifc"))
        
        if not ifc_files:
            self.logger.info("📁 No IFC files found in input directory")
            return
        
        self.logger.info(f"🔄 Starting conversion of {len(ifc_files)} IFC files")
        
        for ifc_file in ifc_files:
            self.convert_file(ifc_file)
        
        self.logger.info("✅ Batch conversion completed")
    
    def start_file_watcher(self):
        """Start the file system watcher"""
        if self.observer:
            self.observer.start()
            self.logger.info("👀 File watcher started")
    
    def stop_file_watcher(self):
        """Stop the file system watcher"""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            self.logger.info("🛑 File watcher stopped")
    
    def run_server(self):
        """Start the Flask API server"""
        self.logger.info(f"🚀 Starting QGEN_IMPFRAG backend server on {self.config.host}:{self.config.port}")
        
        if self.config.watch_enabled:
            self.start_file_watcher()
        
        try:
            self.app.run(
                host=self.config.host,
                port=self.config.port,
                debug=self.config.debug,
                threaded=True
            )
        except KeyboardInterrupt:
            self.logger.info("🛑 Server shutdown requested")
        finally:
            if self.config.watch_enabled:
                self.stop_file_watcher()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="QGEN_IMPFRAG IFC Processor")
    parser.add_argument("--dev", action="store_true", help="Run in development mode")
    parser.add_argument("--watch", action="store_true", help="Monitor IFC directory for new files")
    parser.add_argument("--convert", action="store_true", help="Convert all IFC files immediately and exit")
    parser.add_argument("--port", type=int, default=8000, help="API server port")
    
    args = parser.parse_args()
    
    # Create configuration
    config = Config(
        debug=args.dev,
        watch_enabled=args.watch,
        port=args.port,
        log_level="DEBUG" if args.dev else "INFO"
    )
    
    # Create processor
    processor = QgenImpfragProcessor(config)
    
    # Handle different run modes
    if args.convert:
        processor.logger.info("🔄 Running in convert-only mode")
        processor.convert_all_files()
        processor.logger.info("✅ Conversion completed, exiting")
    else:
        # Auto-convert existing files if enabled
        if config.auto_convert:
            processor.convert_all_files()
        
        # Start server
        processor.run_server()


if __name__ == "__main__":
    main()

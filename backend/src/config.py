"""
Configuration module for QGEN_IMPFRAG backend
===========================================

Centralized configuration management with environment variable support
and validation for the IFC processing backend service.

Author: XQG4_AXIS Team
"""

import os
from pathlib import Path
from typing import Optional


class Config:
    """Configuration class with environment variable support"""
    
    def __init__(self):
        # Base directories
        self.PROJECT_ROOT = Path(os.getenv(
            "QGEN_IMPFRAG_PROJECT_ROOT", 
            "/data/XVUE/XQG4_AXIS/QGEN_IMPFRAG"
        ))
        
        # Data directories
        self.IFC_INPUT_DIR = Path(os.getenv(
            "QGEN_IMPFRAG_IFC_INPUT_DIR",
            self.PROJECT_ROOT / "data" / "ifc"
        ))
        
        self.FRAGMENTS_OUTPUT_DIR = Path(os.getenv(
            "QGEN_IMPFRAG_FRAGMENTS_OUTPUT_DIR",
            self.PROJECT_ROOT / "data" / "fragments"
        ))
        
        self.LOGS_DIR = Path(os.getenv(
            "QGEN_IMPFRAG_LOGS_DIR",
            self.PROJECT_ROOT / "backend" / "logs"
        ))
        
        self.REPORTS_DIR = Path(os.getenv(
            "QGEN_IMPFRAG_REPORTS_DIR",
            self.PROJECT_ROOT / "data" / "reports"
        ))
        
        # Server configuration
        self.HOST = os.getenv("QGEN_IMPFRAG_HOST", "0.0.0.0")
        self.PORT = int(os.getenv("QGEN_IMPFRAG_PORT", "8000"))
        self.DEBUG = os.getenv("QGEN_IMPFRAG_DEBUG", "false").lower() == "true"
        
        # Processing options
        self.WATCH_ENABLED = os.getenv("QGEN_IMPFRAG_WATCH_ENABLED", "false").lower() == "true"
        self.AUTO_CONVERT = os.getenv("QGEN_IMPFRAG_AUTO_CONVERT", "true").lower() == "true"
        self.MAX_FILE_SIZE_MB = int(os.getenv("QGEN_IMPFRAG_MAX_FILE_SIZE_MB", "500"))
        
        # Logging
        self.LOG_LEVEL = os.getenv("QGEN_IMPFRAG_LOG_LEVEL", "INFO")
        
        # Fragment converter settings
        self.FRAG_CONVERT_DIR = Path(os.getenv(
            "QGEN_IMPFRAG_FRAG_CONVERT_DIR",
            "/data/XVUE/frag_convert"
        ))
        
        # Ensure directories exist
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create directories if they don't exist"""
        directories = [
            self.IFC_INPUT_DIR,
            self.FRAGMENTS_OUTPUT_DIR,
            self.LOGS_DIR,
            self.REPORTS_DIR
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def to_dict(self):
        """Convert configuration to dictionary"""
        return {
            "project_root": str(self.PROJECT_ROOT),
            "ifc_input_dir": str(self.IFC_INPUT_DIR),
            "fragments_output_dir": str(self.FRAGMENTS_OUTPUT_DIR),
            "logs_dir": str(self.LOGS_DIR),
            "reports_dir": str(self.REPORTS_DIR),
            "host": self.HOST,
            "port": self.PORT,
            "debug": self.DEBUG,
            "watch_enabled": self.WATCH_ENABLED,
            "auto_convert": self.AUTO_CONVERT,
            "max_file_size_mb": self.MAX_FILE_SIZE_MB,
            "log_level": self.LOG_LEVEL,
            "frag_convert_dir": str(self.FRAG_CONVERT_DIR)
        }

#!/usr/bin/env python3
"""
QGEN_IMPFRAG Backend API Server
=============================

Simple Flask API server to serve converted fragment files to the frontend.
"""

import os
import json
import subprocess
import tempfile
import logging
from pathlib import Path
from datetime import datetime
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

@app.before_request
def log_request():
    print(f"🌐 {request.method} {request.path} from {request.remote_addr}")

# Configuration
# Use absolute paths based on backend script location to avoid working directory issues
BACKEND_DIR = Path(__file__).parent
PROJECT_ROOT = BACKEND_DIR.parent
FRAGMENTS_DIR = PROJECT_ROOT / "data" / "fragments"
IFC_DIR = PROJECT_ROOT / "data" / "ifc"
CONVERTER_SCRIPT = BACKEND_DIR / "ifc_converter.js"

# Debug logging
print(f"🔍 Backend starting from: {Path.cwd()}")
print(f"📁 PROJECT_ROOT: {PROJECT_ROOT}")
print(f"📁 FRAGMENTS_DIR resolved to: {FRAGMENTS_DIR}")
print(f"📁 IFC_DIR resolved to: {IFC_DIR}")
print(f"🔧 CONVERTER_SCRIPT: {CONVERTER_SCRIPT}")
print(f"📄 Actual fragment files found: {list(FRAGMENTS_DIR.glob('*.frag'))}")
print(f"📄 Actual IFC files found: {list(IFC_DIR.glob('*.ifc'))}")

# Ensure directories exist
FRAGMENTS_DIR.mkdir(parents=True, exist_ok=True)
IFC_DIR.mkdir(parents=True, exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "qgen-impfrag-backend"
    })

@app.route('/api/test-subprocess', methods=['GET'])
def test_subprocess():
    """Simple test endpoint"""
    print("🔥 TEST SUBPROCESS ENDPOINT HIT!")
    return jsonify({"message": "Subprocess endpoint working!"})

@app.route('/debug/paths', methods=['GET'])
def debug_paths():
    """Debug endpoint to show exactly where backend is looking"""
    fragments_files = list(FRAGMENTS_DIR.glob("*.frag"))
    return jsonify({
        "working_directory": str(Path.cwd()),
        "fragments_dir": str(FRAGMENTS_DIR),
        "fragments_dir_exists": FRAGMENTS_DIR.exists(),
        "ifc_dir": str(IFC_DIR),
        "ifc_dir_exists": IFC_DIR.exists(),
        "converter_script": str(CONVERTER_SCRIPT),
        "fragments_found": [str(f) for f in fragments_files],
        "fragments_count": len(fragments_files)
    })

@app.route('/api/fragments', methods=['GET'])
def list_fragments():
    """List available fragment files"""
    fragments = []
    
    for frag_file in FRAGMENTS_DIR.glob("*.frag"):
        stat = frag_file.stat()
        fragments.append({
            "filename": frag_file.name,
            "size_mb": round(stat.st_size / (1024 * 1024), 2),
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "url": f"/api/fragments/{frag_file.name}"
        })
    
    return jsonify({
        "fragments": fragments,
        "count": len(fragments),
        "total_size_mb": round(sum(f["size_mb"] for f in fragments), 2)
    })

@app.route('/api/fragments/<filename>', methods=['GET'])
def serve_fragment(filename):
    """Serve a fragment file"""
    fragment_file = FRAGMENTS_DIR / filename
    
    if not fragment_file.exists():
        return jsonify({"error": f"Fragment file not found: {filename}"}), 404
    
    return send_file(fragment_file, as_attachment=False, mimetype='application/octet-stream')

@app.route('/api/ifc', methods=['GET'])
def list_ifc_files():
    """List available IFC files and their conversion status"""
    files = []
    
    for ifc_file in IFC_DIR.glob("*.ifc"):
        # Look for corresponding fragment file
        fragment_name = f"{ifc_file.stem.replace(' ', '_').replace('(', '').replace(')', '')}.frag"
        fragment_file = FRAGMENTS_DIR / fragment_name
        
        stat = ifc_file.stat()
        files.append({
            "filename": ifc_file.name,
            "size_mb": round(stat.st_size / (1024 * 1024), 2),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "has_fragments": fragment_file.exists(),
            "fragment_file": fragment_name if fragment_file.exists() else None,
            "fragment_size_mb": round(fragment_file.stat().st_size / (1024 * 1024), 2) if fragment_file.exists() else None
        })
    
    return jsonify({
        "ifc_files": files,
        "count": len(files),
        "total_size_mb": round(sum(f["size_mb"] for f in files), 2)
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get overall system status"""
    ifc_count = len(list(IFC_DIR.glob("*.ifc")))
    fragment_count = len(list(FRAGMENTS_DIR.glob("*.frag")))
    
    return jsonify({
        "status": "running",
        "ifc_files": ifc_count,
        "fragment_files": fragment_count,
        "conversion_complete": fragment_count > 0,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/convert', methods=['POST'])
def convert_ifc():
    """Convert uploaded IFC file to fragments in memory"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.lower().endswith('.ifc'):
        return jsonify({"error": "File must be an IFC file"}), 400
    
    try:
        # Create temporary file for IFC data
        with tempfile.NamedTemporaryFile(suffix='.ifc', delete=False) as temp_ifc:
            file.save(temp_ifc.name)
            temp_ifc_path = temp_ifc.name
        
        # Generate output filename (sanitized)
        base_name = secure_filename(file.filename)
        base_name = base_name.replace('.ifc', '').replace(' ', '_')
        output_filename = f"{base_name}.frag"
        output_path = FRAGMENTS_DIR / output_filename
        
        # Check file size for memory optimization
        temp_file_size = Path(temp_ifc_path).stat().st_size
        file_size_mb = temp_file_size / (1024 * 1024)
        
        # Build command with memory optimization for large files
        if file_size_mb > 50:  # Large files > 50MB
            cmd = [
                'node', '--max-old-space-size=8192', '--max-semi-space-size=1024', '--expose-gc',
                str(CONVERTER_SCRIPT),
                '--input', temp_ifc_path,
                '--output', str(output_path)
            ]
            timeout = 3600  # 1 hour for very large files
            print(f"📏 Large file ({file_size_mb:.1f} MB): Using Node.js memory optimization + 1 hour timeout")
        elif file_size_mb > 20:  # Medium files > 20MB
            cmd = [
                'node', '--max-old-space-size=4096', '--expose-gc',
                str(CONVERTER_SCRIPT),
                '--input', temp_ifc_path,
                '--output', str(output_path)
            ]
            timeout = 1800  # 30 minutes for medium files
            print(f"📏 Medium file ({file_size_mb:.1f} MB): Using moderate memory boost + 30 minute timeout")
        else:  # Small files
            cmd = [
                'node', str(CONVERTER_SCRIPT),
                '--input', temp_ifc_path,
                '--output', str(output_path)
            ]
            timeout = 600   # 10 minutes for small files
            print(f"📏 Small file ({file_size_mb:.1f} MB): Using default memory + 10 minute timeout")
        
        print(f"🔄 Converting: {file.filename} -> {output_filename}")
        print(f"📄 Command: {' '.join(cmd)}")
        print(f"📁 Working directory: {Path(__file__).parent}")
        print(f"🔧 Converter script exists: {CONVERTER_SCRIPT.exists()}")
        print(f"📁 Temp IFC file: {temp_ifc_path}")
        print(f"📁 Output path: {output_path}")
        
        # Check if node is available
        try:
            node_check = subprocess.run(['node', '--version'], capture_output=True, text=True)
            print(f"🔧 Node.js version: {node_check.stdout.strip()}")
        except Exception as node_error:
            print(f"❌ Node.js not found: {node_error}")
        
        # Try with UTF-8 encoding and timeout handling
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, 
                                   cwd=Path(__file__).parent, encoding='utf-8', errors='replace',
                                   timeout=timeout)
        except subprocess.TimeoutExpired:
            # Clean up temp file
            os.unlink(temp_ifc_path)
            return jsonify({
                "success": False,
                "error": f"Conversion timed out after {timeout/60:.1f} minutes"
            }), 500
        except Exception as encoding_error:
            print(f"🔄 Encoding error, trying without capture: {encoding_error}")
            # Fallback: run without capturing output to see errors directly
            try:
                result = subprocess.run(cmd, cwd=Path(__file__).parent, timeout=timeout)
                result.stdout = "No output captured"
                result.stderr = "No stderr captured"
            except subprocess.TimeoutExpired:
                # Clean up temp file
                os.unlink(temp_ifc_path)
                return jsonify({
                    "success": False,
                    "error": f"Conversion timed out after {timeout/60:.1f} minutes"
                }), 500
        
        print(f"📤 Return code: {result.returncode}")
        print(f"📤 STDOUT: {result.stdout}")
        print(f"📤 STDERR: {result.stderr}")
        print(f"📁 Output file exists after conversion: {output_path.exists()}")
        
        # Clean up temporary file
        os.unlink(temp_ifc_path)
        
        if result.returncode == 0 and output_path.exists():
            # Get file stats
            stat = output_path.stat()
            return jsonify({
                "success": True,
                "message": f"Successfully converted {file.filename}",
                "output_file": output_filename,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "conversion_time": "< 1 minute"
            })
        else:
            error_msg = result.stderr if result.stderr else "Conversion failed"
            print(f"❌ Conversion error: {error_msg}")
            return jsonify({
                "success": False,
                "error": f"Conversion failed: {error_msg}"
            }), 500
            
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_ifc_path' in locals() and os.path.exists(temp_ifc_path):
            os.unlink(temp_ifc_path)
            return jsonify({
                "success": False,
                "error": f"Server error: {str(e)}"
            }), 500

@app.route('/api/convert-subprocess', methods=['POST'])
def convert_ifc_subprocess():
    """Convert uploaded IFC file to fragments using external frag_convert package"""
    print("🔥 SUBPROCESS ENDPOINT HIT!")  # Debug log
    
    if 'file' not in request.files:
        print("❌ No file in request")
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        print("❌ Empty filename")
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.lower().endswith('.ifc'):
        print(f"❌ Invalid file type: {file.filename}")
        return jsonify({"error": "File must be an IFC file"}), 400
    
    print(f"✅ Processing file: {file.filename}")
    
    try:
        # Check if external converter exists
        frag_convert_dir = PROJECT_ROOT / "frag_convert"
        converter_script = frag_convert_dir / "ifc_fragments_converter.py"
        
        print(f"🔍 Looking for converter at: {converter_script}")
        print(f"📁 Converter exists: {converter_script.exists()}")
        print(f"📁 frag_convert directory exists: {frag_convert_dir.exists()}")
        
        if not converter_script.exists():
            print(f"❌ External converter not found at {converter_script}")
            return jsonify({
                "success": False,
                "error": f"External converter not found at {converter_script}"
            }), 500
        
        # Create temporary file for IFC data
        with tempfile.NamedTemporaryFile(suffix='.ifc', delete=False) as temp_ifc:
            file.save(temp_ifc.name)
            temp_ifc_path = temp_ifc.name
        
        print(f"📄 Saved to temp file: {temp_ifc_path}")
        
        # Generate output filename (sanitized)
        base_name = secure_filename(file.filename)
        base_name = base_name.replace('.ifc', '').replace(' ', '_')
        output_filename = f"{base_name}_subprocess.frag"
        output_path = FRAGMENTS_DIR / output_filename
        
        print(f"⚡ Subprocess Converting: {file.filename} -> {output_filename}")
        print(f"📄 Using External Frag Convert Package")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            print(f"📁 Created temp directory: {temp_dir_path}")
            
            # Save uploaded file to temp directory with original name
            temp_ifc_file = temp_dir_path / file.filename
            with open(temp_ifc_file, 'wb') as f:
                file.seek(0)  # Reset file pointer
                f.write(file.read())
            
            print(f"📄 Saved IFC to temp directory: {temp_ifc_file}")
            print(f"📏 IFC file size: {temp_ifc_file.stat().st_size} bytes")
            
            cmd = [
                'python', str(converter_script),
                str(temp_dir_path),  # source directory
                str(FRAGMENTS_DIR),  # target directory  
                '--single', file.filename,  # convert only this file
                '--auto'  # auto-overwrite existing files without prompting
            ]
            
            print(f"📄 Subprocess Command: {' '.join(cmd)}")
            print(f"🔧 Working directory: {frag_convert_dir}")
            print(f"🔧 Using external converter: {converter_script}")
            
            # Run with subprocess isolation and extended timeout for large files
            try:
                print("⚡ Starting subprocess...")
                
                # Determine timeout based on file size
                file_size_mb = temp_ifc_file.stat().st_size / (1024 * 1024)
                if file_size_mb > 100:
                    timeout = 3600  # 1 hour for files > 100MB
                elif file_size_mb > 50:
                    timeout = 1800  # 30 minutes for files > 50MB
                elif file_size_mb > 10:
                    timeout = 1200  # 20 minutes for files > 10MB
                else:
                    timeout = 600   # 10 minutes for smaller files
                
                print(f"📏 File size: {file_size_mb:.2f} MB, using timeout: {timeout/60:.1f} minutes")
                
                result = subprocess.run(
                    cmd, 
                    capture_output=True, 
                    text=True,
                    cwd=str(frag_convert_dir),  # Run from converter directory
                    encoding='utf-8', 
                    errors='replace',
                    timeout=timeout  # Dynamic timeout based on file size
                )
                print("⚡ Subprocess completed")
            except subprocess.TimeoutExpired:
                print(f"❌ Subprocess timed out after {timeout/60:.1f} minutes")
                return jsonify({
                    "success": False,
                    "error": f"External subprocess conversion timed out after {timeout/60:.1f} minutes"
                }), 500
            except Exception as subprocess_error:
                print(f"❌ Subprocess error: {subprocess_error}")
                return jsonify({
                    "success": False,
                    "error": f"Subprocess execution failed: {str(subprocess_error)}"
                }), 500
            
            print(f"⚡ Subprocess Return code: {result.returncode}")
            if result.stdout:
                print(f"⚡ Subprocess STDOUT:\n{result.stdout}")
            if result.stderr:
                print(f"⚡ Subprocess STDERR:\n{result.stderr}")
            
            # Check if output file was created (the converter creates it with base name + .frag)
            possible_outputs = [
                FRAGMENTS_DIR / f"{base_name}.frag",
                FRAGMENTS_DIR / f"{file.filename.replace('.ifc', '')}.frag",
                output_path
            ]
            
            print(f"🔍 Looking for output files:")
            for possible_output in possible_outputs:
                print(f"  - {possible_output}: {possible_output.exists()}")
            
            actual_output = None
            for possible_output in possible_outputs:
                if possible_output.exists():
                    actual_output = possible_output
                    print(f"✅ Found output at: {actual_output}")
                    break
            
            if actual_output and actual_output != output_path:
                # Rename to our naming convention
                print(f"📝 Renaming {actual_output} to {output_path}")
                actual_output.rename(output_path)
            
            print(f"📁 Final output file exists: {output_path.exists()}")
        
        # Clean up temporary file
        print(f"🧹 Cleaning up temp file: {temp_ifc_path}")
        os.unlink(temp_ifc_path)
        
        if result.returncode == 0 and output_path.exists():
            # Get file stats
            stat = output_path.stat()
            return jsonify({
                "success": True,
                "message": f"Successfully converted {file.filename} using external subprocess converter",
                "output_file": output_filename,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "conversion_time": "< 10 minutes",
                "method": "external_frag_convert"
            })
        else:
            error_msg = result.stderr if result.stderr else "External subprocess conversion failed"
            print(f"❌ Subprocess conversion error: {error_msg}")
            return jsonify({
                "success": False,
                "error": f"External subprocess conversion failed: {error_msg}"
            }), 500
            
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_ifc_path' in locals() and os.path.exists(temp_ifc_path):
            os.unlink(temp_ifc_path)
        if 'output_path' in locals() and output_path.exists():
            os.unlink(output_path)
        return jsonify({
            "success": False,
            "error": f"Subprocess converter error: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting QGEN_IMPFRAG Backend API Server...")
    print(f"📁 IFC Directory: {IFC_DIR}")
    print(f"📁 Fragments Directory: {FRAGMENTS_DIR}")
    print(f"🌐 Server will run on http://127.0.0.1:8111")
    
    app.run(host='127.0.0.1', port=8111, debug=False)

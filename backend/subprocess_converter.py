#!/usr/bin/env python3
"""
Standalone IFC to Fragments Subprocess Converter
================================================
Simple subprocess converter for XFRG that uses ThatOpen Components
via Node.js in an isolated process, inspired by F16 approach.
"""

import sys
import os
import subprocess
import tempfile
import json
import time
from pathlib import Path
from typing import Dict, Optional

class XFRGSubprocessConverter:
    """
    Standalone subprocess converter for XFRG using ThatOpen Components
    """
    
    def __init__(self):
        self.backend_dir = Path(__file__).parent
        self.project_root = self.backend_dir.parent
        self.converter_script = self.backend_dir / "ifc_converter.js"
        
        # Validate that the JavaScript converter exists
        if not self.converter_script.exists():
            raise FileNotFoundError(f"JavaScript converter not found: {self.converter_script}")
    
    def convert_ifc_file(self, input_file: str, output_file: str, timeout: int = 600) -> Dict:
        """
        Convert IFC file to fragments using subprocess isolation
        
        Args:
            input_file: Path to input IFC file
            output_file: Path to output fragment file
            timeout: Timeout in seconds (default 10 minutes)
            
        Returns:
            Dict with conversion results
        """
        start_time = time.time()
        input_path = Path(input_file)
        output_path = Path(output_file)
        
        if not input_path.exists():
            return {
                "success": False,
                "error": f"Input file not found: {input_file}",
                "conversion_time": 0
            }
        
        print(f"🔄 XFRG Subprocess Converter: {input_path.name}")
        print(f"📁 Input: {input_path}")
        print(f"📁 Output: {output_path}")
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # Build Node.js command with memory allocation
            cmd = [
                'node', 
                '--max-old-space-size=8192',  # 8GB memory for large files
                str(self.converter_script),
                '--input', str(input_path),
                '--output', str(output_path)
            ]
            
            print(f"🔧 Command: {' '.join(cmd)}")
            print(f"🧠 Memory: 8GB allocated for subprocess")
            print(f"⏰ Timeout: {timeout} seconds")
            
            # Execute with subprocess isolation
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=self.backend_dir,
                encoding='utf-8',
                errors='replace',
                timeout=timeout
            )
            
            conversion_time = time.time() - start_time
            
            print(f"🔄 Return code: {result.returncode}")
            print(f"⏱️  Conversion time: {conversion_time:.2f}s")
            
            if result.stdout.strip():
                print(f"📤 STDOUT: {result.stdout}")
            if result.stderr.strip():
                print(f"📥 STDERR: {result.stderr}")
            
            # Check if conversion was successful
            if result.returncode == 0 and output_path.exists():
                file_size = output_path.stat().st_size
                file_size_mb = file_size / (1024 * 1024)
                
                print(f"✅ Success: {output_path.name} ({file_size_mb:.2f} MB)")
                
                return {
                    "success": True,
                    "output_file": output_path.name,
                    "file_size": file_size,
                    "file_size_mb": round(file_size_mb, 2),
                    "conversion_time": round(conversion_time, 2),
                    "method": "subprocess_isolation",
                    "converter": "thatopen_components_subprocess"
                }
            else:
                error_msg = result.stderr if result.stderr else f"Conversion failed with return code {result.returncode}"
                print(f"❌ Failed: {error_msg}")
                
                return {
                    "success": False,
                    "error": error_msg,
                    "conversion_time": round(conversion_time, 2),
                    "return_code": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
        
        except subprocess.TimeoutExpired:
            conversion_time = time.time() - start_time
            error_msg = f"Conversion timed out after {timeout} seconds"
            print(f"⏰ {error_msg}")
            
            return {
                "success": False,
                "error": error_msg,
                "conversion_time": round(conversion_time, 2),
                "timeout": timeout
            }
        
        except Exception as e:
            conversion_time = time.time() - start_time
            error_msg = f"Subprocess execution failed: {str(e)}"
            print(f"💥 {error_msg}")
            
            return {
                "success": False,
                "error": error_msg,
                "conversion_time": round(conversion_time, 2),
                "exception": str(e)
            }

def main():
    """Command line interface for standalone usage"""
    if len(sys.argv) != 3:
        print("Usage: python subprocess_converter.py <input_file> <output_file>")
        print("Example: python subprocess_converter.py model.ifc model.frag")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    converter = XFRGSubprocessConverter()
    result = converter.convert_ifc_file(input_file, output_file)
    
    # Print result as JSON for programmatic usage
    print("\n" + "="*50)
    print("CONVERSION RESULT:")
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main()

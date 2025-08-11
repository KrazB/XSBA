#!/usr/bin/env python3
"""
Test the IFC conversion process
"""
import os
import subprocess
from pathlib import Path

def test_conversion():
    """Test IFC to fragment conversion"""
    backend_dir = Path(__file__).parent
    ifc_file = backend_dir.parent / "data" / "ifc" / "Village_STR_Building C_R22-2023.01.27.ifc"
    output_file = backend_dir.parent / "data" / "fragments" / "test_conversion.frag"
    converter_script = backend_dir / "ifc_converter.js"
    
    print(f"🔍 Testing IFC Conversion")
    print(f"📁 IFC File: {ifc_file}")
    print(f"📁 Output: {output_file}")
    print(f"🔧 Converter: {converter_script}")
    
    # Check if files exist
    if not ifc_file.exists():
        print(f"❌ IFC file not found: {ifc_file}")
        return False
        
    if not converter_script.exists():
        print(f"❌ Converter script not found: {converter_script}")
        return False
    
    # Run conversion
    cmd = [
        'node', str(converter_script),
        '--input', str(ifc_file),
        '--output', str(output_file)
    ]
    
    print(f"🔄 Running command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=backend_dir)
        print(f"📤 Return code: {result.returncode}")
        print(f"📤 STDOUT: {result.stdout}")
        print(f"📤 STDERR: {result.stderr}")
        
        if result.returncode == 0 and output_file.exists():
            print(f"✅ Conversion successful!")
            print(f"📊 Output size: {output_file.stat().st_size / (1024*1024):.2f} MB")
            return True
        else:
            print(f"❌ Conversion failed")
            return False
            
    except Exception as e:
        print(f"❌ Error running conversion: {e}")
        return False

if __name__ == "__main__":
    test_conversion()

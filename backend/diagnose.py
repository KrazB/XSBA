#!/usr/bin/env python3
"""
Quick test to diagnose the IFC conversion issue
"""
import subprocess
import sys
from pathlib import Path

def check_environment():
    """Check if all requirements are available"""
    print("🔍 Diagnosing IFC Conversion Environment")
    print("=" * 50)
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
        else:
            print(f"❌ Node.js not working: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found in PATH")
        return False
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm: {result.stdout.strip()}")
        else:
            print(f"❌ npm not working: {result.stderr}")
    except FileNotFoundError:
        print("❌ npm not found in PATH")
    
    # Check if converter script exists
    backend_dir = Path(__file__).parent
    converter_script = backend_dir / "ifc_converter.js"
    
    if converter_script.exists():
        print(f"✅ Converter script: {converter_script}")
    else:
        print(f"❌ Converter script not found: {converter_script}")
        return False
    
    # Check if node_modules exists
    node_modules = backend_dir / "node_modules"
    if node_modules.exists():
        print(f"✅ Dependencies installed: {node_modules}")
    else:
        print(f"❌ Dependencies NOT installed: {node_modules}")
        print("💡 Try running: npm install")
        return False
    
    # Check specific dependencies
    deps_to_check = [
        "@thatopen/components",
        "@thatopen/fragments", 
        "web-ifc"
    ]
    
    for dep in deps_to_check:
        dep_path = node_modules / dep
        if dep_path.exists():
            print(f"✅ {dep}: installed")
        else:
            print(f"❌ {dep}: missing")
    
    return True

def test_converter():
    """Test the converter with minimal input"""
    print("\n🧪 Testing Converter Script")
    print("=" * 30)
    
    backend_dir = Path(__file__).parent
    converter_script = backend_dir / "ifc_converter.js"
    
    # Test just running the script
    try:
        result = subprocess.run(['node', str(converter_script), '--help'], 
                              capture_output=True, text=True, cwd=backend_dir)
        print(f"📤 Return code: {result.returncode}")
        print(f"📤 STDOUT: {result.stdout}")
        print(f"📤 STDERR: {result.stderr}")
        
        if result.returncode != 0:
            print("❌ Converter script has issues")
            return False
        else:
            print("✅ Converter script runs")
            return True
            
    except Exception as e:
        print(f"❌ Error running converter: {e}")
        return False

if __name__ == "__main__":
    env_ok = check_environment()
    if env_ok:
        test_converter()
    else:
        print("\n💡 Fix environment issues first, then retry conversion")

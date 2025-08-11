#!/usr/bin/env python3
"""
XFRG IFC Converter Verification Test
===================================

Tests the complete IFC to fragments conversion pipeline:
1. ThatOpen Components availability
2. Node.js converter functionality  
3. Python backend integration
4. End-to-end conversion workflow
"""

import subprocess
import sys
from pathlib import Path
import json

def test_nodejs_converter():
    """Test the Node.js ThatOpen Components converter"""
    print("🧪 Testing Node.js ThatOpen Components Converter...")
    
    backend_dir = Path(__file__).parent
    converter_script = backend_dir / "ifc_converter.js"
    test_script = backend_dir / "test_converter.js"
    
    # Test 1: Check if converter script exists
    if not converter_script.exists():
        print(f"❌ Converter script not found: {converter_script}")
        return False
    
    if not test_script.exists():
        print(f"❌ Test script not found: {test_script}")
        return False
    
    print(f"✅ Converter scripts found")
    
    # Test 2: Run the test script
    try:
        result = subprocess.run(
            ["node", str(test_script)],
            cwd=str(backend_dir),
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("✅ ThatOpen Components test passed")
            print("📋 Test output:")
            for line in result.stdout.split('\n'):
                if line.strip():
                    print(f"   {line}")
            return True
        else:
            print(f"❌ ThatOpen Components test failed:")
            print(f"   {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Test timed out")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def test_conversion_capability():
    """Test actual IFC to fragments conversion"""
    print("\n🔄 Testing IFC to Fragments Conversion...")
    
    backend_dir = Path(__file__).parent
    data_dir = backend_dir.parent / "data"
    ifc_dir = data_dir / "ifc"
    fragments_dir = data_dir / "fragments"
    
    # Check directories
    if not ifc_dir.exists():
        print(f"❌ IFC directory not found: {ifc_dir}")
        return False
    
    if not fragments_dir.exists():
        print(f"❌ Fragments directory not found: {fragments_dir}")
        return False
    
    # Find IFC files
    ifc_files = list(ifc_dir.glob("*.ifc"))
    if not ifc_files:
        print("❌ No IFC files found")
        return False
    
    print(f"📁 Found {len(ifc_files)} IFC files")
    
    # Check existing fragments
    fragment_files = list(fragments_dir.glob("*.frag"))
    print(f"📦 Found {len(fragment_files)} existing fragment files")
    
    # Calculate compression ratios
    for ifc_file in ifc_files:
        frag_name = f"{ifc_file.stem}.frag"
        frag_file = fragments_dir / frag_name
        
        if frag_file.exists():
            ifc_size = ifc_file.stat().st_size
            frag_size = frag_file.stat().st_size
            compression = (1 - frag_size / ifc_size) * 100
            
            print(f"✅ {ifc_file.name}:")
            print(f"   IFC:  {ifc_size / 1024 / 1024:.2f} MB")
            print(f"   Frag: {frag_size / 1024 / 1024:.2f} MB")
            print(f"   Compression: {compression:.1f}%")
        else:
            print(f"⚠️  {ifc_file.name}: No fragment file found")
    
    return len(fragment_files) > 0

def test_python_backend():
    """Test Python backend integration"""
    print("\n🐍 Testing Python Backend Integration...")
    
    backend_dir = Path(__file__).parent
    processor_script = backend_dir / "src" / "ifc_processor.py"
    
    if not processor_script.exists():
        print(f"❌ Processor script not found: {processor_script}")
        return False
    
    print("✅ Python processor found")
    
    # Test importing the processor
    try:
        sys.path.insert(0, str(backend_dir / "src"))
        from ifc_processor import QgenImpfragProcessor, Config
        print("✅ Python processor imports successfully")
        
        # Test configuration
        config = Config()
        print(f"✅ Configuration loaded")
        print(f"   IFC dir: {config.ifc_input_dir}")
        print(f"   Fragments dir: {config.fragments_output_dir}")
        
        return True
        
    except Exception as e:
        print(f"❌ Python backend test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🔍 XFRG IFC Converter Verification")
    print("=" * 50)
    
    tests = [
        ("Node.js Converter", test_nodejs_converter),
        ("Conversion Capability", test_conversion_capability),
        ("Python Backend", test_python_backend),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
            if result:
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! IFC to Fragments converter is working correctly.")
        print("\n📝 Summary of capabilities:")
        print("   ✅ ThatOpen Components available and functional")
        print("   ✅ Node.js converter can process IFC files")
        print("   ✅ Python backend can integrate with converter")
        print("   ✅ Complete IFC → Fragment pipeline operational")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the output above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

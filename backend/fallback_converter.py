#!/usr/bin/env python3
"""
Alternative IFC converter using Python libraries as fallback
This can be used if Node.js dependencies fail to install
"""

import os
import sys
from pathlib import Path

def check_python_ifc_libraries():
    """Check if Python IFC libraries are available"""
    try:
        import ifcopenshell
        print(f"✅ ifcopenshell version: {ifcopenshell.version}")
        return True
    except ImportError:
        print("❌ ifcopenshell not installed")
        print("💡 Install with: pip install ifcopenshell")
        return False

def convert_ifc_python(ifc_path, output_path):
    """Convert IFC to a simplified format using Python"""
    try:
        import ifcopenshell
        import json
        
        print(f"🔄 Converting {ifc_path} using Python...")
        
        # Open IFC file
        model = ifcopenshell.open(ifc_path)
        
        # Extract basic information
        data = {
            "schema": model.schema,
            "elements": len(model.by_type("IfcElement")),
            "spaces": len(model.by_type("IfcSpace")),
            "walls": len(model.by_type("IfcWall")),
            "converted_by": "Python fallback converter"
        }
        
        # Save as JSON (not a real fragment, but a placeholder)
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ Converted to {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Python conversion failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python fallback_converter.py input.ifc output.json")
        sys.exit(1)
    
    ifc_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if check_python_ifc_libraries():
        convert_ifc_python(ifc_path, output_path)
    else:
        print("Install ifcopenshell first: pip install ifcopenshell")
        sys.exit(1)

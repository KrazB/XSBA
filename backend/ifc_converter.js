#!/usr/bin/env node
/**
 * IFC to Fragments Converter using ThatOpen Components
 * ==================================================
 * 
 * This script converts IFC files to fragment format using ThatOpen Components.
 * Based on the official ThatOpen Components IfcImporter documentation.
 * 
 * Usage:
 *   node ifc_converter.js --input input.ifc --output output.frag
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use node_modules in parent directory (XFRG root has the dependencies)
const rootNodeModules = path.resolve(__dirname, '../node_modules');

console.log(`🔍 Looking for dependencies in: ${rootNodeModules}`);

// Verify web-ifc WASM files exist
const webIfcPath = path.join(rootNodeModules, 'web-ifc');
const wasmFile = path.join(webIfcPath, 'web-ifc-node.wasm');
console.log(`🔍 Checking for WASM file: ${wasmFile}`);
console.log(`📁 WASM file exists: ${fs.existsSync(wasmFile)}`);

// ThatOpen Components imports - using the correct API from documentation
let FRAGS;

try {
    // Import only what we need for IFC conversion
    console.log('🔧 Loading ThatOpen Components...');
    
    FRAGS = await import('@thatopen/fragments');
    console.log('✅ @thatopen/fragments loaded');
    
    console.log('✅ ThatOpen Components loaded successfully');
} catch (error) {
    console.error('❌ Failed to load ThatOpen Components:', error.message);
    console.error('   Make sure to run: npm install @thatopen/fragments web-ifc');
    process.exit(1);
}

class IfcFragmentsConverter {
    constructor() {
        console.log('🔧 IFC Fragments Converter initialized (using IfcImporter API)');
    }

    async convertFile(inputPath, outputPath) {
        try {
            console.log(`🔄 Converting: ${inputPath} -> ${outputPath}`);
            
            // Check if input file exists
            if (!fs.existsSync(inputPath)) {
                throw new Error(`Input file not found: ${inputPath}`);
            }
            
            // Read IFC file as Buffer
            const ifcData = fs.readFileSync(inputPath);
            console.log(`📖 Read IFC file: ${(ifcData.length / 1024 / 1024).toFixed(2)} MB`);
            
            // Create IFC importer using the correct API from documentation
            const serializer = new FRAGS.IfcImporter();
            
            // Configure WASM path (use local node_modules for Node.js environment)
            // Ensure proper path formatting for Windows
            const wasmPath = path.join(rootNodeModules, 'web-ifc') + path.sep;
            console.log(`🔧 Setting WASM path to: ${wasmPath}`);
            
            serializer.wasm = {
                path: wasmPath,
                absolute: true
            };
            
            console.log('🏗️  Converting IFC to fragments...');
            
            // Convert IFC to fragments using the correct API from documentation
            const fragmentsData = await serializer.process({
                bytes: new Uint8Array(ifcData),
                raw: false, // Compressed output for smaller files
                progressCallback: (progress, data) => {
                    console.log(`Progress: ${Math.round(progress * 100)}% - ${data?.process || 'processing'}`);
                }
            });
            
            // Save to output file
            fs.writeFileSync(outputPath, fragmentsData);
            
            const outputSize = fs.statSync(outputPath).size;
            const inputSize = fs.statSync(inputPath).size;
            const compressionRatio = ((1 - outputSize / inputSize) * 100).toFixed(1);
            
            console.log(`✅ Conversion completed:`);
            console.log(`   Input:  ${(inputSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Output: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Compression: ${compressionRatio}%`);
            
            return {
                success: true,
                inputSize,
                outputSize,
                compressionRatio: parseFloat(compressionRatio)
            };
            
        } catch (error) {
            console.error('❌ Conversion failed:', error.message);
            throw error;
        }
    }

    async convertDirectory(inputDir, outputDir) {
        try {
            console.log(`🔄 Converting directory: ${inputDir} -> ${outputDir}`);
            
            // Ensure output directory exists
            fs.mkdirSync(outputDir, { recursive: true });
            
            // Find all IFC files
            const ifcFiles = fs.readdirSync(inputDir)
                .filter(file => file.toLowerCase().endsWith('.ifc'))
                .map(file => path.join(inputDir, file));
            
            if (ifcFiles.length === 0) {
                console.log('⚠️  No IFC files found in input directory');
                return { success: true, converted: 0 };
            }
            
            console.log(`📁 Found ${ifcFiles.length} IFC files`);
            
            const results = [];
            for (const ifcFile of ifcFiles) {
                const baseName = path.basename(ifcFile, '.ifc');
                const outputFile = path.join(outputDir, `${baseName}.frag`);
                
                const result = await this.convertFile(ifcFile, outputFile);
                results.push({ inputFile: ifcFile, outputFile, ...result });
            }
            
            const successful = results.filter(r => r.success).length;
            console.log(`🎉 Batch conversion completed: ${successful}/${results.length} files`);
            
            return {
                success: true,
                converted: successful,
                total: results.length,
                results
            };
            
        } catch (error) {
            console.error(`❌ Directory conversion failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Usage:
  Single file:    node ifc_converter.js --input file.ifc --output file.frag
  Directory:      node ifc_converter.js --input-dir ./ifc --output-dir ./fragments
  Test mode:      node ifc_converter.js --test
        `);
        process.exit(1);
    }
    
    const converter = new IfcFragmentsConverter();
    
    if (args.includes('--test')) {
        // Test mode - convert sample files if available
        const testInputDir = path.join(__dirname, '../data/ifc');
        const testOutputDir = path.join(__dirname, '../data/fragments');
        
        console.log('🧪 Running in test mode');
        console.log(`   Input dir:  ${testInputDir}`);
        console.log(`   Output dir: ${testOutputDir}`);
        
        const result = await converter.convertDirectory(testInputDir, testOutputDir);
        process.exit(result.success ? 0 : 1);
    }
    
    const inputIndex = args.indexOf('--input');
    const outputIndex = args.indexOf('--output');
    const inputDirIndex = args.indexOf('--input-dir');
    const outputDirIndex = args.indexOf('--output-dir');
    
    if (inputIndex !== -1 && outputIndex !== -1) {
        // Single file conversion
        const inputFile = args[inputIndex + 1];
        const outputFile = args[outputIndex + 1];
        
        const result = await converter.convertFile(inputFile, outputFile);
        process.exit(result.success ? 0 : 1);
        
    } else if (inputDirIndex !== -1 && outputDirIndex !== -1) {
        // Directory conversion
        const inputDir = args[inputDirIndex + 1];
        const outputDir = args[outputDirIndex + 1];
        
        const result = await converter.convertDirectory(inputDir, outputDir);
        process.exit(result.success ? 0 : 1);
        
    } else {
        console.error('❌ Invalid arguments. Use --help for usage information.');
        process.exit(1);
    }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('ifc_converter.js')) {
    main().catch(error => {
        console.error('❌ Unhandled error:', error);
        process.exit(1);
    });
}

export { IfcFragmentsConverter };

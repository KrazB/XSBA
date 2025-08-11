import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * IFC File Diagnostic Tool
 * Analyzes IFC files for potential conversion issues
 */

function analyzeIFCFile(filePath) {
    console.log('🔍 IFC File Diagnostic Analysis');
    console.log('================================');
    console.log(`📁 File: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ File not found!');
        return;
    }
    
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📊 File Size: ${sizeInMB} MB`);
    console.log(`📅 Modified: ${stats.mtime.toISOString()}`);
    
    // Check if file is too large for memory processing
    const warningSize = 100; // MB
    const criticalSize = 500; // MB
    
    if (stats.size > criticalSize * 1024 * 1024) {
        console.log('🔴 CRITICAL: File is extremely large (>500MB)');
        console.log('   - May cause memory exhaustion');
        console.log('   - Requires streaming/chunked processing');
    } else if (stats.size > warningSize * 1024 * 1024) {
        console.log('🟡 WARNING: Large file detected (>100MB)');
        console.log('   - May require increased memory limits');
        console.log('   - Monitor memory usage during conversion');
    } else {
        console.log('🟢 File size appears manageable');
    }
    
    console.log('\n📖 Reading file header...');
    
    try {
        // Read first 1024 bytes to analyze IFC header
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(1024);
        const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
        fs.closeSync(fd);
        
        const header = buffer.slice(0, bytesRead).toString('utf8');
        
        // Extract IFC schema version
        const schemaMatch = header.match(/FILE_SCHEMA\s*\(\s*\('([^']+)'\)/i);
        if (schemaMatch) {
            console.log(`📋 IFC Schema: ${schemaMatch[1]}`);
        }
        
        // Check for encoding issues
        if (header.includes('\0') || header.includes('�')) {
            console.log('⚠️  WARNING: Potential encoding issues detected');
        }
        
        // Check for valid IFC start
        if (header.startsWith('ISO-10303-21;')) {
            console.log('✅ Valid IFC file format detected');
        } else {
            console.log('❌ Invalid IFC file format - missing ISO-10303-21 header');
        }
        
    } catch (error) {
        console.log('❌ Error reading file header:', error.message);
    }
    
    console.log('\n🔧 Recommended Settings:');
    if (stats.size > 200 * 1024 * 1024) {
        console.log('- Increase Node.js memory: --max-old-space-size=8192');
        console.log('- Use streaming conversion');
        console.log('- Consider file preprocessing');
    } else if (stats.size > 50 * 1024 * 1024) {
        console.log('- Increase Node.js memory: --max-old-space-size=4096');
        console.log('- Monitor memory usage');
    }
    
    console.log('\n📈 Memory Estimation:');
    const estimatedRAM = Math.ceil(stats.size / (1024 * 1024) * 3); // Rough 3x multiplier
    console.log(`- Estimated RAM needed: ~${estimatedRAM} MB`);
    console.log(`- Current Node.js limit: ~${Math.floor(process.memoryUsage().heapTotal / (1024 * 1024))} MB`);
    
    console.log('\n================================');
}

// Main execution
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.log('Usage: node diagnose_ifc.js <path-to-ifc-file>');
        process.exit(1);
    }
    
    analyzeIFCFile(filePath);
}

export { analyzeIFCFile };

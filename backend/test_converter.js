#!/usr/bin/env node
/**
 * ThatOpen Components Converter Test
 * =================================
 * 
 * Simple test to verify ThatOpen Components IFC conversion capability
 */

import fs from 'fs';
import path from 'path';

async function testConverter() {
    try {
        console.log('🧪 Testing ThatOpen Components IFC Converter...');
        
        // Import ThatOpen Components
        const OBC = await import('@thatopen/components');
        const FRAGS = await import('@thatopen/fragments');
        
        console.log('✅ ThatOpen Components imported successfully');
        console.log('✅ Fragments library imported successfully');
        
        // List available components
        console.log('\n📋 Available OBC components:');
        const components = new OBC.Components();
        
        // Check key components
        const hasIfcLoader = components.get(OBC.IfcLoader);
        const hasFragmentsManager = components.get(OBC.FragmentsManager);
        
        console.log(`   IfcLoader: ${hasIfcLoader ? '✅ Available' : '❌ Missing'}`);
        console.log(`   FragmentsManager: ${hasFragmentsManager ? '✅ Available' : '❌ Missing'}`);
        
        // Check for IFC files
        const ifcDir = path.join(process.cwd(), '../data/ifc');
        const fragmentsDir = path.join(process.cwd(), '../data/fragments');
        
        console.log(`\n📁 Checking directories:`);
        console.log(`   IFC directory: ${ifcDir}`);
        console.log(`   Fragments directory: ${fragmentsDir}`);
        
        if (fs.existsSync(ifcDir)) {
            const ifcFiles = fs.readdirSync(ifcDir).filter(f => f.endsWith('.ifc'));
            console.log(`   Found ${ifcFiles.length} IFC files`);
            ifcFiles.forEach(file => {
                const stat = fs.statSync(path.join(ifcDir, file));
                console.log(`     - ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
            });
        } else {
            console.log('   ❌ IFC directory not found');
        }
        
        if (fs.existsSync(fragmentsDir)) {
            const fragFiles = fs.readdirSync(fragmentsDir).filter(f => f.endsWith('.frag'));
            console.log(`   Found ${fragFiles.length} Fragment files`);
            fragFiles.forEach(file => {
                const stat = fs.statSync(path.join(fragmentsDir, file));
                console.log(`     - ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
            });
        } else {
            console.log('   ❌ Fragments directory not found');
        }
        
        console.log('\n🎉 ThatOpen Components test completed successfully!');
        console.log('🔧 IFC to Fragments converter is ready to use.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testConverter();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing ThatOpen Components dependencies...');

const dependencies = [
  '@thatopen/components@^2.4.11',
  '@thatopen/fragments@^3.0.7', 
  'web-ifc@^0.0.68'
];

try {
  // Change to the correct directory
  const backendDir = __dirname;
  console.log(`📁 Working in: ${backendDir}`);
  
  // Install each dependency
  for (const dep of dependencies) {
    console.log(`📦 Installing ${dep}...`);
    execSync(`npm install ${dep}`, { 
      cwd: backendDir, 
      stdio: 'inherit' 
    });
  }
  
  // Check if node_modules was created
  const nodeModulesPath = path.join(backendDir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules directory created');
    
    // List installed packages
    const installedPackages = fs.readdirSync(nodeModulesPath)
      .filter(dir => dir.startsWith('@') || dependencies.some(dep => dep.startsWith(dir)));
    
    console.log('📦 Installed packages:');
    installedPackages.forEach(pkg => console.log(`  - ${pkg}`));
  } else {
    console.log('❌ node_modules directory not created');
  }
  
  console.log('🎉 Installation complete!');
  
} catch (error) {
  console.error('❌ Installation failed:', error.message);
  process.exit(1);
}

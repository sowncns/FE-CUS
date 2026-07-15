const fs = require('fs');

const files = [
  'd:/NhaHang/igourmet-app/src/components/ProfileDrawer.tsx',
  'd:/NhaHang/igourmet-app/src/pages/IGoCard.tsx',
  'd:/NhaHang/igourmet-app/src/pages/Home.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Find the 'const t = {' block
  // Use a more robust regex
  const tMatch = content.match(/const t = \{([\s\S]*?)\};/);
  
  if (tMatch) {
    const tBlock = tMatch[0];
    const tBody = tMatch[1];
    
    // Parse the keys and values
    const dict = {};
    const lines = tBody.split(/\r?\n/);
    for (const line of lines) {
      const lineMatch = line.match(/^\s*([a-zA-Z0-9_]+):\s*"(.*?)",?\s*$/);
      if (lineMatch) {
        dict[lineMatch[1]] = lineMatch[2];
      }
    }
    
    // Replace all t.key with "value"
    content = content.replace(/t\.([a-zA-Z0-9_]+)/g, (match, key) => {
      if (dict[key] !== undefined) {
        return JSON.stringify(dict[key]);
      }
      return match;
    });
    
    // Remove the const t block
    content = content.replace(tBlock, '');
    
    fs.writeFileSync(file, content);
    console.log('Processed', file);
  } else {
    console.log('No t block found in', file);
  }
}

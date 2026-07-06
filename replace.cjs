const fs = require('fs');
const files = [
  'src/components/Layout.tsx',
  'src/components/ProfileDrawer.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { API_BASE_URL }')) {
    content = content.replace(/(import.*?;?\r?\n)/, "$1import { API_BASE_URL } from '../lib/api';\n");
  }
  
  content = content.replace(/http:\/\/localhost:5000/g, '${API_BASE_URL}');
  
  fs.writeFileSync(file, content);
});
console.log('Done');

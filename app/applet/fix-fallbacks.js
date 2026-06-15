const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('/app/applet/services'), ...walk('/app/applet/features')];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Find callWithRetry calls with a single fallback function
  const regex = /callWithRetry<[^>]+>\(\s*\(\)\s*=>\s*ai\.models\.generateContent\([\s\S]*?\),\s*\d+,\s*\d+,\s*[^,]+,\s*(\(\)\s*=>\s*ai\.models\.generateContent\([\s\S]*?\))\s*\)/g;
  
  content = content.replace(regex, (match, p1) => {
    modified = true;
    return match.replace(p1, `[${p1}]`);
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});

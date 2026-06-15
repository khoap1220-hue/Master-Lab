const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Replace `, imageSize: "1K"` or `, imageSize: "4K"` or `, imageSize: "512px"`
  content = content.replace(/,\s*imageSize:\s*"(1K|4K|512px)"/g, '');
  // Replace `imageSize: "...", `
  content = content.replace(/imageSize:\s*"(1K|4K|512px)",\s*/g, '');
  // Replace `imageSize: "..."` (if it's the only property)
  content = content.replace(/imageSize:\s*"(1K|4K|512px)"/g, '');

  // Also replace any hardcoded gemini-3.1-flash-image-preview or gemini-3-pro-image-preview with gemini-2.5-flash-image
  content = content.replace(/'gemini-3\.1-flash-image-preview'/g, "'gemini-2.5-flash-image'");
  content = content.replace(/'gemini-3-pro-image-preview'/g, "'gemini-2.5-flash-image'");
  content = content.replace(/"gemini-3\.1-flash-image-preview"/g, '"gemini-2.5-flash-image"');
  content = content.replace(/"gemini-3-pro-image-preview"/g, '"gemini-2.5-flash-image"');

  // Replace gemini-3.1-pro-preview with gemini-3-flash-preview
  content = content.replace(/'gemini-3\.1-pro-preview'/g, "'gemini-3-flash-preview'");
  content = content.replace(/"gemini-3\.1-pro-preview"/g, '"gemini-3-flash-preview"');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Done. Updated ${changedFiles} files.`);

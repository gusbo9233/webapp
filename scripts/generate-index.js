const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'ukrainian-explainations');
const files = fs.readdirSync(dir)
  .filter(file => file.endsWith('.html'))
  .sort();

const filesWithContent = files.map(filename => {
  const content = fs.readFileSync(
    path.join(dir, filename), 
    'utf-8'
  );
  return {
    filename,
    content
  };
});

fs.writeFileSync(
  path.join(dir, 'index.json'),
  JSON.stringify(filesWithContent, null, 2)
); 
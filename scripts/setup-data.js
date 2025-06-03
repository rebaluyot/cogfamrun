// setup-data.js
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { parse } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hostname = '127.0.0.1';
const port = 3030;

const server = http.createServer((req, res) => {
  // Get the file path
  const parsedUrl = parse(req.url || '');
  let pathname = path.join(process.cwd(), parsedUrl.pathname || '');
  
  // If path is '/', serve the data seeding guide
  if (parsedUrl.pathname === '/' || !parsedUrl.pathname) {
    pathname = path.join(process.cwd(), 'data-seeding-guide.html');
  }
  
  // Map file extension to content type
  const extname = String(path.extname(pathname)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
  };
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Read the file and serve it
  fs.readFile(pathname, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end(`File not found: ${pathname}`);
      return;
    }
    
    res.setHeader('Content-type', contentType);
    res.end(data);
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log('Opening data seeding guide in your browser...');
  open(`http://${hostname}:${port}/`);
  console.log('\nFollow the instructions in the guide to populate your database with real data.');
  console.log('\nPress Ctrl+C to close this server when you\'re done.');
});

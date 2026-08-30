const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 5000;
const DIST_DIR = path.join(__dirname, '..', 'dist');

// MIME-Typen für korrekte Dateiverarbeitung im Browser
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

if (!fs.existsSync(DIST_DIR)) {
  console.error('\x1b[31m%s\x1b[0m', 'Fehler: Der Ordner "dist/" existiert nicht.');
  console.log('Bitte führe zuerst "npm run build:web" aus, um die Web-Version zu bauen.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Pfad bereinigen
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Verhindern, dass aus dem Verzeichnis ausgebrochen wird
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }

  const ext = path.extname(filePath);
  let contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Bei Single Page Applications (SPA): Wenn Datei nicht gefunden, index.html ausgeben (Routing-Unterstützung)
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, spaContent) => {
          if (err2) {
            res.statusCode = 500;
            res.end('Internal Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(spaContent, 'utf-8');
          }
        });
      } else {
        res.statusCode = 500;
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('\x1b[32m%s\x1b[0m', `⚡ Web-Server läuft unter: ${url}`);
  console.log('Drücke STRG+C, um den Server zu stoppen.');

  // Browser automatisch öffnen (Windows/macOS/Linux kompatibel)
  const startCommand = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${startCommand} ${url}`);
});

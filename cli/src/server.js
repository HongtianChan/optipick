const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { solveOptimalSamples } = require('./algorithm');
const { saveResult, listDbFiles, readDbFile, deleteDbFile } = require('./db');

function start(port = 3000) {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // API 路由
    if (pathname === '/api/solve' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const params = JSON.parse(body);
          const { m, n, k, j, s, atLeast = 1, samples } = params;
          
          const result = solveOptimalSamples(m, n, k, j, s, atLeast, samples);
          
          let fileName = null;
          if (params.save) {
            fileName = saveResult(m, n, k, j, s, result.samples, result.groups);
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...result, fileName }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    
    if (pathname === '/api/files' && req.method === 'GET') {
      const files = listDbFiles();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
      return;
    }
    
    if (pathname === '/api/file' && req.method === 'GET') {
      const fileName = parsedUrl.query.f;
      try {
        const data = readDbFile(fileName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }
    
    if (pathname === '/api/file' && req.method === 'DELETE') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { fileName } = JSON.parse(body);
          if (deleteDbFile(fileName)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
          }
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    
    // 静态文件
    if (pathname === '/' || pathname === '/index.html') {
      // 优先从 web-ui 目录读取，如果没有则从 cli/web 读取
      const webUiPath = path.join(__dirname, '../../web-ui/index.html');
      const cliWebPath = path.join(__dirname, '../web/index.html');
      const htmlPath = fs.existsSync(webUiPath) ? webUiPath : cliWebPath;
      const html = fs.readFileSync(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
  
  server.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
  });
}

module.exports = { start };


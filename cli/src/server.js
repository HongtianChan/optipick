const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { solveOptimalSamples } = require('./algorithm');
const { saveResult, listDbFiles, readDbFile, deleteDbFile } = require('./db');
const { evaluateCoverage, normalizeGroups: normalizeVerifyGroups, validateCandidate } = require('./verify');

function normalizeGroups(groups) {
  if (!Array.isArray(groups)) throw new Error('groups must be an array');
  return groups.map((g) => {
    if (!Array.isArray(g) || g.length === 0) throw new Error('each group must be a non-empty array');
    return [...g];
  });
}

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
          const { m, n, k, j, s, atLeast = 1, samples, precomputed, solveMode = 'balanced' } = params;
          const solveStart = Date.now();
          let result;
          if (precomputed && Array.isArray(precomputed.groups) && Array.isArray(precomputed.samples)) {
            const normalizedGroups = normalizeGroups(precomputed.groups);
            result = {
              samples: precomputed.samples,
              groups: normalizedGroups,
              count: precomputed.count || normalizedGroups.length,
              method: precomputed.method || 'unknown'
            };
          } else {
            result = solveOptimalSamples(m, n, k, j, s, atLeast, samples, solveMode);
          }
          const solveMs = Date.now() - solveStart;
          
          let fileName = null;
          const saveStart = Date.now();
          if (params.save) {
            fileName = saveResult(m, n, k, j, s, result.samples, result.groups, {
              atLeast,
              solveMode: params.solveMode || 'balanced',
              method: result.method
            });
          }
          const saveMs = params.save ? Date.now() - saveStart : 0;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...result, fileName, timing: { solveMs, saveMs, totalMs: solveMs + saveMs } }));
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

    if (pathname === '/api/verify' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const params = JSON.parse(body);
          const { k, j, s, atLeast = 1, samples, groups } = params;
          if (!Array.isArray(samples) || !samples.length) throw new Error('samples must be a non-empty array');
          if (!Array.isArray(groups) || !groups.length) throw new Error('groups must be a non-empty array');
          if (!Number.isInteger(k) || k <= 0) throw new Error('k must be a positive integer');
          if (!Number.isInteger(j) || !Number.isInteger(s) || j <= 0 || s <= 0) {
            throw new Error('j and s must be positive integers');
          }
          const normalized = normalizeVerifyGroups(groups);
          validateCandidate(samples, normalized, k);
          const check = evaluateCoverage(samples, normalized, j, s, atLeast);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(check));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    if (pathname === '/api/export' && req.method === 'GET') {
      try {
        const files = listDbFiles();
        const results = files.map((fileName) => {
          const record = readDbFile(fileName);
          return {
            file_name: fileName,
            m: record.m,
            n: record.n,
            k: record.k,
            j: record.j,
            s: record.s,
            samples: record.samples,
            groups: record.groups,
            count: record.count,
            run_count: Number(fileName.split('-')[5] || 1),
            created_at: record.timestamp || null
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          exportedAt: new Date().toISOString(),
          total: results.length,
          results
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
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
    if (pathname === '/favicon.svg' && req.method === 'GET') {
      const iconPath = path.join(__dirname, '../../web-ui/favicon.svg');
      if (!fs.existsSync(iconPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      const svg = fs.readFileSync(iconPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
      res.end(svg);
      return;
    }

    // 静态文件
    if (pathname === '/' || pathname === '/index.html') {
      // Try multiple locations to support different repo layouts.
      const webUiPath = path.join(__dirname, '../../web-ui/index.html');
      const rootIndexPath = path.join(__dirname, '../../index.html');
      const cliWebPath = path.join(__dirname, '../web/index.html');
      const htmlPath = [webUiPath, rootIndexPath, cliWebPath].find((p) => fs.existsSync(p));
      if (!htmlPath) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'index.html not found for local web mode' }));
        return;
      }
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


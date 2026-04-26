const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.optimal-samples-selector', 'db');
const DB_FILE_RE = /^\d+-\d+-\d+-\d+-\d+-\d+-\d+$/;

// Ensure the DB directory exists.
function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// Generate file name: m-n-k-j-s-x-y.
function generateFileName(m, n, k, j, s, runCount, resultCount) {
  return `${m}-${n}-${k}-${j}-${s}-${runCount}-${resultCount}`;
}

function validateDbFileName(fileName) {
  if (typeof fileName !== 'string' || !DB_FILE_RE.test(fileName)) {
    throw new Error('Invalid DB file name');
  }
  return fileName;
}

// Save result to file. JSON includes atLeast / solveMode / method for reproducibility.
function saveResult(m, n, k, j, s, samples, groups, meta = {}) {
  ensureDbDir();
  const atLeast = meta.atLeast != null ? meta.atLeast : 1;
  const solveMode = meta.solveMode || 'balanced';
  const method = meta.method != null ? meta.method : null;

  // Find existing run count.
  const pattern = `${m}-${n}-${k}-${j}-${s}-`;
  const files = fs.readdirSync(DB_DIR).filter(f => f.startsWith(pattern));
  
  let runCount = 1;
  if (files.length > 0) {
    const counts = files.map(f => {
      const match = f.match(/-(\d+)-(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
    runCount = Math.max(...counts) + 1;
  }
  
  const fileName = generateFileName(m, n, k, j, s, runCount, groups.length);
  const filePath = path.join(DB_DIR, fileName);
  
  const content = {
    m, n, k, j, s,
    atLeast,
    solveMode,
    method,
    samples,
    groups: groups.map(g => g.sort((a, b) => a - b)),
    count: groups.length,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  return fileName;
}

// Read all DB file names.
function listDbFiles() {
  ensureDbDir();
  const files = fs.readdirSync(DB_DIR)
    .filter(f => f.endsWith('.json') || /^\d+-\d+-\d+-\d+-\d+-\d+-\d+$/.test(f))
    .sort();
  return files;
}

// Read DB file content.
function readDbFile(fileName) {
  const safeFileName = validateDbFileName(fileName);
  const filePath = path.join(DB_DIR, safeFileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${safeFileName}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Delete DB file.
function deleteDbFile(fileName) {
  const safeFileName = validateDbFileName(fileName);
  const filePath = path.join(DB_DIR, safeFileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

// Format result groups for display.
function formatGroups(groups) {
  return groups.map((group, idx) => {
    return `${idx + 1}. [${group.join(', ')}]`;
  }).join('\n');
}

module.exports = {
  saveResult,
  listDbFiles,
  readDbFile,
  deleteDbFile,
  validateDbFileName,
  formatGroups,
  DB_DIR
};


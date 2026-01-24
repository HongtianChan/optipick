const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.optimal-samples-selector', 'db');

// 确保目录存在
function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// 生成文件名：m-n-k-j-s-x-y
function generateFileName(m, n, k, j, s, runCount, resultCount) {
  return `${m}-${n}-${k}-${j}-${s}-${runCount}-${resultCount}`;
}

// 保存结果到文件
function saveResult(m, n, k, j, s, samples, groups) {
  ensureDbDir();
  
  // 查找已有的运行次数
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
    samples,
    groups: groups.map(g => g.sort((a, b) => a - b)),
    count: groups.length,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  return fileName;
}

// 读取所有 DB 文件列表
function listDbFiles() {
  ensureDbDir();
  const files = fs.readdirSync(DB_DIR)
    .filter(f => f.endsWith('.json') || /^\d+-\d+-\d+-\d+-\d+-\d+-\d+$/.test(f))
    .sort();
  return files;
}

// 读取 DB 文件内容
function readDbFile(fileName) {
  const filePath = path.join(DB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${fileName}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// 删除 DB 文件
function deleteDbFile(fileName) {
  const filePath = path.join(DB_DIR, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

// 格式化输出结果（用于显示）
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
  formatGroups,
  DB_DIR
};


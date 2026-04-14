#!/usr/bin/env node

const { Command } = require('commander');
const { solveOptimalSamples } = require('./src/algorithm');
const { saveResult, listDbFiles, readDbFile, deleteDbFile, formatGroups } = require('./src/db');
const toInt = (val) => Number.parseInt(val, 10);

const program = new Command();

program
  .name('oss')
  .description('Optimal Samples Selector - 最优样本选择系统')
  .version('1.0.0');

// 执行计算
program
  .command('solve')
  .description('计算最优样本组')
  .requiredOption('-m <number>', '总样本数 (45-54)', toInt)
  .requiredOption('-n <number>', '从 m 中选的样本数 (7-25)', toInt)
  .requiredOption('-k <number>', '组大小 (4-7)', toInt)
  .requiredOption('-j <number>', 'j 参数 (s <= j <= k)', toInt)
  .requiredOption('-s <number>', 's 参数 (3-7)', toInt)
  .option('--at-least <number>', '至少覆盖的 s 组合数 (默认 1)', toInt, 1)
  .option('--samples <numbers>', '手动输入 n 个样本，用逗号分隔', (val) => {
    return val.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  })
  .option('--save', '保存结果到 DB 文件')
  .action((options) => {
    const { m, n, k, j, s, atLeast, samples, save } = options;
    
    // 参数验证
    if (m < 45 || m > 54) {
      console.error('错误: m 必须在 45-54 之间');
      process.exit(1);
    }
    if (n < 7 || n > 25) {
      console.error('错误: n 必须在 7-25 之间');
      process.exit(1);
    }
    if (k < 4 || k > 7) {
      console.error('错误: k 必须在 4-7 之间');
      process.exit(1);
    }
    if (s < 3 || s > 7) {
      console.error('错误: s 必须在 3-7 之间');
      process.exit(1);
    }
    if (j < s || j > k) {
      console.error(`错误: j 必须在 ${s} 到 ${k} 之间`);
      process.exit(1);
    }
    if (samples && samples.length !== n) {
      console.error(`错误: 需要输入 ${n} 个样本，但提供了 ${samples.length} 个`);
      process.exit(1);
    }
    
    console.log('计算中...');
    const startTime = Date.now();
    
    const result = solveOptimalSamples(m, n, k, j, s, atLeast, samples);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n=== 结果 ===');
    console.log(`选中的 ${n} 个样本: [${result.samples.join(', ')}]`);
    console.log(`算法: ${result.method === 'backtrack' ? '回溯（精确）' : '贪心（近似）'}`);
    console.log(`最少组数: ${result.count}`);
    console.log(`计算时间: ${duration} 秒\n`);
    
    console.log('组详情:');
    result.groups.forEach((group, idx) => {
      console.log(`  ${idx + 1}. [${group.join(', ')}]`);
    });
    
    if (save) {
      const fileName = saveResult(m, n, k, j, s, result.samples, result.groups);
      console.log(`\n已保存到: ${fileName}`);
    }
  });

// 列出所有 DB 文件
program
  .command('list')
  .description('列出所有保存的 DB 文件')
  .action(() => {
    const files = listDbFiles();
    if (files.length === 0) {
      console.log('没有找到 DB 文件');
      return;
    }
    
    console.log(`找到 ${files.length} 个文件:\n`);
    files.forEach((file, idx) => {
      console.log(`  ${idx + 1}. ${file}`);
    });
  });

// 显示 DB 文件内容
program
  .command('show')
  .description('显示 DB 文件内容')
  .requiredOption('-f <filename>', '文件名')
  .action((options) => {
    try {
      const data = readDbFile(options.f);
      console.log(`\n文件: ${options.f}`);
      console.log(`参数: m=${data.m}, n=${data.n}, k=${data.k}, j=${data.j}, s=${data.s}`);
      console.log(`样本: [${data.samples.join(', ')}]`);
      console.log(`组数: ${data.count}\n`);
      
      console.log('组详情:');
      data.groups.forEach((group, idx) => {
        console.log(`  ${idx + 1}. [${group.join(', ')}]`);
      });
    } catch (error) {
      console.error(`错误: ${error.message}`);
      process.exit(1);
    }
  });

// 删除 DB 文件
program
  .command('delete')
  .description('删除 DB 文件')
  .requiredOption('-f <filename>', '文件名')
  .action((options) => {
    if (deleteDbFile(options.f)) {
      console.log(`已删除: ${options.f}`);
    } else {
      console.error(`错误: 文件不存在 ${options.f}`);
      process.exit(1);
    }
  });

// 启动 Web UI
program
  .command('web')
  .description('启动 Web UI 服务器')
  .option('-p <port>', '端口号', toInt, 3000)
  .action((options) => {
    console.log(`启动 Web UI 服务器在端口 ${options.p}...`);
    console.log(`访问 http://localhost:${options.p}`);
    
    // 启动服务器（稍后实现）
    require('./src/server').start(options.p);
  });

program.parse();


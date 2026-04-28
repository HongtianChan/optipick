#!/usr/bin/env node

const { Command } = require('commander');
const { solveOptimalSamples } = require('./src/algorithm');
const { saveResult, listDbFiles, readDbFile, deleteDbFile, formatGroups } = require('./src/db');
const { verifyCoverageOrThrow } = require('./src/verify');
const toInt = (val) => Number.parseInt(val, 10);

const program = new Command();

program
  .name('oss')
  .description('Optimal Samples Selector')
  .version('1.0.0');

// Run solver
program
  .command('solve')
  .description('Calculate optimal sample groups')
  .requiredOption('-m <number>', 'Total sample count (45-54)', toInt)
  .requiredOption('-n <number>', 'Selected sample count from m (7-25)', toInt)
  .requiredOption('-k <number>', 'Group size (4-7)', toInt)
  .requiredOption('-j <number>', 'j parameter (s <= j <= k)', toInt)
  .requiredOption('-s <number>', 's parameter (3-7)', toInt)
  .option('--at-least <number>', 'Minimum covered s-combinations (default 1)', toInt, 1)
  .option('--solve-mode <mode>', 'Solve mode: fast, balanced, quality', 'balanced')
  .option('--samples <numbers>', 'Manual selected samples, comma-separated', (val) => {
    return val.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  })
  .option('--save', 'Save result to DB file')
  .action((options) => {
    const { m, n, k, j, s, atLeast, samples, save } = options;
    const solveMode = options.solveMode || 'balanced';
    
    // Parameter validation
    if (m < 45 || m > 54) {
      console.error('Error: m must be between 45 and 54');
      process.exit(1);
    }
    if (n < 7 || n > 25) {
      console.error('Error: n must be between 7 and 25');
      process.exit(1);
    }
    if (k < 4 || k > 7) {
      console.error('Error: k must be between 4 and 7');
      process.exit(1);
    }
    if (s < 3 || s > 7) {
      console.error('Error: s must be between 3 and 7');
      process.exit(1);
    }
    if (j < s || j > k) {
      console.error(`Error: j must be between ${s} and ${k}`);
      process.exit(1);
    }
    if (samples && samples.length !== n) {
      console.error(`Error: expected ${n} samples, but received ${samples.length}`);
      process.exit(1);
    }
    if (!['fast', 'balanced', 'quality'].includes(solveMode)) {
      console.error('Error: solve-mode must be fast, balanced, or quality');
      process.exit(1);
    }
    
    console.log('Solving...');
    const startTime = Date.now();
    
    const result = solveOptimalSamples(m, n, k, j, s, atLeast, samples, solveMode);
    verifyCoverageOrThrow(result.samples, result.groups, k, j, s, atLeast);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n=== Result ===');
    console.log(`Selected ${n} samples: [${result.samples.join(', ')}]`);
    console.log(`Method: ${result.method === 'backtrack' ? 'Backtracking (exact)' : 'Greedy/GRASP (heuristic)'}`);
    console.log(`Minimum group count: ${result.count}`);
    console.log(`Runtime: ${duration} seconds\n`);
    
    console.log('Groups:');
    result.groups.forEach((group, idx) => {
      console.log(`  ${idx + 1}. [${group.join(', ')}]`);
    });
    
    if (save) {
      const fileName = saveResult(m, n, k, j, s, result.samples, result.groups, {
        atLeast,
        solveMode,
        method: result.method
      });
      console.log(`\nSaved as: ${fileName}`);
    }
  });

// List all DB files
program
  .command('list')
  .description('List all saved DB files')
  .action(() => {
    const files = listDbFiles();
    if (files.length === 0) {
      console.log('No DB files found');
      return;
    }
    
    console.log(`Found ${files.length} file(s):\n`);
    files.forEach((file, idx) => {
      console.log(`  ${idx + 1}. ${file}`);
    });
  });

// Show DB file content
program
  .command('show')
  .description('Show DB file content')
  .requiredOption('-f <filename>', 'File name')
  .action((options) => {
    try {
      const data = readDbFile(options.f);
      console.log(`\nFile: ${options.f}`);
      console.log(`Parameters: m=${data.m}, n=${data.n}, k=${data.k}, j=${data.j}, s=${data.s}`);
      console.log(`Samples: [${data.samples.join(', ')}]`);
      console.log(`Group count: ${data.count}\n`);
      
      console.log('Groups:');
      data.groups.forEach((group, idx) => {
        console.log(`  ${idx + 1}. [${group.join(', ')}]`);
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Delete DB file
program
  .command('delete')
  .description('Delete DB file')
  .requiredOption('-f <filename>', 'File name')
  .action((options) => {
    if (deleteDbFile(options.f)) {
      console.log(`Deleted: ${options.f}`);
    } else {
      console.error(`Error: file not found ${options.f}`);
      process.exit(1);
    }
  });

// Start Web UI
program
  .command('web')
  .description('Start Web UI server')
  .option('-p <port>', 'Port number', toInt, 3000)
  .action((options) => {
    console.log(`Starting Web UI server on port ${options.p}...`);
    console.log(`Open http://localhost:${options.p}`);
    
    require('./src/server').start(options.p);
  });

program.parse();


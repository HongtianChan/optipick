const { createClient } = require('@supabase/supabase-js');
const { solveOptimalSamples } = require('./algorithm');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validateInputs(m, n, k, j, s, atLeast, samples) {
  const fields = { m, n, k, j, s, atLeast };
  for (const [key, val] of Object.entries(fields)) {
    if (!isPositiveInteger(val)) {
      throw new Error(`${key} must be a positive integer`);
    }
  }

  if (m < 45 || m > 54) throw new Error('m must be between 45 and 54');
  if (n < 7 || n > 25) throw new Error('n must be between 7 and 25');
  if (k < 4 || k > 7) throw new Error('k must be between 4 and 7');
  if (s < 3 || s > 7) throw new Error('s must be between 3 and 7');
  if (j < s || j > k) throw new Error(`j must be between ${s} and ${k}`);
  if (n > m) throw new Error('n must be less than or equal to m');
  if (k > n) throw new Error('k must be less than or equal to n');
  if (j > n) throw new Error('j must be less than or equal to n');

  if (samples != null) {
    if (!Array.isArray(samples)) throw new Error('samples must be an array');
    if (samples.length !== n) throw new Error(`samples must contain exactly ${n} values`);
    for (const x of samples) {
      if (!isPositiveInteger(x)) throw new Error('all samples must be positive integers');
      if (x < 1 || x > m) throw new Error(`sample values must be between 1 and ${m}`);
    }
    if (new Set(samples).size !== samples.length) {
      throw new Error('sample values must be unique');
    }
  }
}

async function saveResult(m, n, k, j, s, samples, groups) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data: existing } = await supabase
    .from('results')
    .select('run_count')
    .eq('m', m)
    .eq('n', n)
    .eq('k', k)
    .eq('j', j)
    .eq('s', s)
    .order('run_count', { ascending: false })
    .limit(1);
  
  const runCount = existing && existing.length > 0 ? existing[0].run_count + 1 : 1;
  const fileName = `${m}-${n}-${k}-${j}-${s}-${runCount}-${groups.length}`;
  
  const { error } = await supabase
    .from('results')
    .insert({
      file_name: fileName,
      m, n, k, j, s,
      samples: JSON.stringify(samples),
      groups: JSON.stringify(groups.map(g => g.sort((a, b) => a - b))),
      count: groups.length,
      run_count: runCount,
      created_at: new Date().toISOString()
    });
  
  if (error) throw error;
  return fileName;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { m, n, k, j, s, atLeast = 1, samples, save } = body;
    
    // 参数验证
    if (!m || !n || !k || !j || !s) {
      return res.status(400).json({ error: 'Missing required parameters: m, n, k, j, s' });
    }

    validateInputs(m, n, k, j, s, atLeast, samples);
    
    const result = solveOptimalSamples(m, n, k, j, s, atLeast, samples);
    
    let fileName = null;
    if (save) {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured. Please check environment variables.' });
      }
      fileName = await saveResult(m, n, k, j, s, result.samples, result.groups);
    }
    
    res.status(200).json({ ...result, fileName });
  } catch (error) {
    console.error('API Error:', error);
    res.status(400).json({ error: error.message || 'Unknown error' });
  }
};

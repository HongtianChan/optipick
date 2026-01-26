const { createClient } = require('@supabase/supabase-js');
const { solveOptimalSamples } = require('./algorithm');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
    
    if (j < s || j > k) {
      return res.status(400).json({ error: `j must be between ${s} and ${k}` });
    }
    
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

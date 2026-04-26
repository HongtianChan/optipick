const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const DB_FILE_RE = /^\d+-\d+-\d+-\d+-\d+-\d+-\d+$/;

function validateFileName(fileName) {
  if (typeof fileName !== 'string' || !DB_FILE_RE.test(fileName)) {
    throw new Error('Invalid file name');
  }
  return fileName;
}

async function readDbFile(fileName) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const safeFileName = validateFileName(fileName);
  
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('file_name', safeFileName)
    .single();
  
  if (error) throw new Error(`File not found: ${safeFileName}`);
  
  return {
    m: data.m,
    n: data.n,
    k: data.k,
    j: data.j,
    s: data.s,
    samples: JSON.parse(data.samples),
    groups: JSON.parse(data.groups),
    count: data.count
  };
}

async function deleteDbFile(fileName) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const safeFileName = validateFileName(fileName);
  
  const { error } = await supabase
    .from('results')
    .delete()
    .eq('file_name', safeFileName);
  
  if (error) throw error;
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const fileName = url.searchParams.get('f');
      if (!fileName) {
        res.status(400).json({ error: 'Missing file parameter' });
        return;
      }
      const data = await readDbFile(fileName);
      res.status(200).json(data);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
    return;
  }
  
  if (req.method === 'DELETE') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { fileName } = body;
      await deleteDbFile(fileName);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
    return;
  }
  
  res.status(405).json({ error: 'Method not allowed' });
};

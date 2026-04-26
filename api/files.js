const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function unavailableResponse(message) {
  return {
    files: [],
    unavailable: true,
    error: message
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    if (!supabase) {
      res.status(200).json(unavailableResponse('Cloud history is not configured for this deployment.'));
      return;
    }
    
    const { data, error } = await supabase
      .from('results')
      .select('file_name')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.status(200).json({ files: data.map(row => row.file_name) });
  } catch (error) {
    res.status(200).json(unavailableResponse('Cloud history is currently unavailable. Solve and verify still work.'));
  }
};

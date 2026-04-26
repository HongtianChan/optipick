const { evaluateCoverage, normalizeGroups, normalizeSamples, validateCandidate } = require('./verify-core');
const MAX_BODY_BYTES = 1024 * 1024;

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
    if (typeof req.body === 'string' && Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Request body too large' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { k, j, s, atLeast = 1, samples, groups } = body || {};
    if (!Number.isInteger(j) || !Number.isInteger(s) || j <= 0 || s <= 0) {
      return res.status(400).json({ error: 'j and s must be positive integers' });
    }
    if (!Number.isInteger(k) || k <= 0) {
      return res.status(400).json({ error: 'k must be a positive integer' });
    }
    if (!Number.isInteger(atLeast) || atLeast <= 0) {
      return res.status(400).json({ error: 'atLeast must be a positive integer' });
    }
    const normalizedSamples = normalizeSamples(samples);
    const normalizedGroups = normalizeGroups(groups);
    validateCandidate(normalizedSamples, normalizedGroups, k);
    const check = evaluateCoverage(normalizedSamples, normalizedGroups, j, s, atLeast);
    res.status(200).json(check);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unknown error' });
  }
};

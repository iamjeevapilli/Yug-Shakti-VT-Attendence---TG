const { verifyToken } = require('./_auth.js');
const vtsData = require('./_vts_data.json');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  // 1. Strict Authentication Check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || (req.query && req.query.token);

  const session = verifyToken(token);
  if (!session || session.role !== 'admin') {
    // REFUSE DATA TO SIGNED-OUT VISITORS (HTTP 401)
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized: Access to Vocational Trainer (VT) register requires an active Admin session.'
    });
  }

  // 2. Return the protected trainer records
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return res.status(200).json(vtsData);
};

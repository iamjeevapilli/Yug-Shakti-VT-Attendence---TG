const crypto = require('crypto');
const { signToken, verifyToken, getAdminPasswordHash } = require('./_auth.js');

module.exports = async function handler(req, res) {
  // Enable CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Validate existing session token
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const session = verifyToken(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid or expired session.' });
    }
    return res.status(200).json({ ok: true, session });
  }

  // POST: Login and issue session token
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }
    body = body || {};

    const username = (body.username || '').trim();
    let inputHash = (body.passwordHash || body.hash || '').trim().toLowerCase();

    if (!inputHash && body.password) {
      inputHash = crypto.createHash('sha256').update(body.password).digest('hex').toLowerCase();
    }

    if (!username || !inputHash) {
      return res.status(400).json({ ok: false, error: 'Username and password are required.' });
    }

    if (username !== 'admin') {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }

    const expectedHash = await getAdminPasswordHash();
    if (inputHash !== expectedHash) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }

    const token = signToken({ role: 'admin', user: 'admin' });
    return res.status(200).json({
      ok: true,
      token,
      role: 'admin',
      message: 'Authentication successful.'
    });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
};

const crypto = require('crypto');

const SERVER_SECRET = process.env.SESSION_SECRET || 'YUG_SHAKTI_SECURE_PORTAL_AUTH_SECRET_2026_!@#$%^';
const DEFAULT_ADMIN_HASH = 'cfcbcff8054d5e8e48e0479535c24c0db2a70d1f71fea4b7bd195a14146ae224';

function signToken(payload) {
  const data = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const str = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', SERVER_SECRET).update(str).digest('base64url');
  return str + '.' + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [str, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SERVER_SECRET).update(str).digest('base64url');
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

async function getAdminPasswordHash() {
  try {
    const res = await fetch('https://firestore.googleapis.com/v1/projects/yugshaktivtattendancetg/databases/(default)/documents/yug_data/adminPassHash');
    if (res.ok) {
      const data = await res.json();
      if (data.fields && data.fields.data && data.fields.data.stringValue) {
        let val = data.fields.data.stringValue;
        try { val = JSON.parse(val); } catch(e) {}
        if (typeof val === 'string' && val.length === 64) {
          return val.toLowerCase();
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch hash from Firestore, using default fallback:', err.message);
  }
  return DEFAULT_ADMIN_HASH;
}

module.exports = {
  signToken,
  verifyToken,
  getAdminPasswordHash
};

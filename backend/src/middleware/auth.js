const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const OIDC_JWKS_URI = process.env.OIDC_JWKS_URI || '';
const ISSUER_URLS_FROM_ENV = (process.env.OIDC_ISSUER_URLS || '')
  .split(',')
  .map((issuer) => issuer.trim())
  .filter(Boolean);
const ACCEPTED_AUDIENCES = (process.env.OIDC_ACCEPTED_AUDIENCES || '')
  .split(',')
  .map((audience) => audience.trim())
  .filter(Boolean);
const DEV_AUTH_BYPASS = String(process.env.DEV_AUTH_BYPASS || 'false').toLowerCase() === 'true';

if (!DEV_AUTH_BYPASS && (!OIDC_JWKS_URI || ISSUER_URLS_FROM_ENV.length === 0)) {
  throw new Error('OIDC_JWKS_URI and OIDC_ISSUER_URLS must be configured when DEV_AUTH_BYPASS is false');
}

const client = jwksClient({
  jwksUri: OIDC_JWKS_URI
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function hasAcceptedAudience(payload) {
  if (ACCEPTED_AUDIENCES.length === 0) {
    return true;
  }

  const candidates = [];

  if (Array.isArray(payload.aud)) {
    candidates.push(...payload.aud);
  } else if (payload.aud) {
    candidates.push(payload.aud);
  }

  if (payload.azp) {
    candidates.push(payload.azp);
  }

  if (payload.clientId) {
    candidates.push(payload.clientId);
  }

  return candidates.some((value) => ACCEPTED_AUDIENCES.includes(String(value)));
}

function setDevUser(req) {
  req.user = {
    sub: 'dev-user',
    email: 'dev@example.local',
    name: 'Developer',
    preferred_username: 'developer',
    roles: ['user']
  };
}

function normalizeUserFromToken(verified) {
  const sub = verified.sub;
  const email = verified.email
    || verified.email_address
    || verified.primary_email_address
    || (Array.isArray(verified.email_addresses) && verified.email_addresses.length > 0
      ? verified.email_addresses[0]
      : null)
    || `${sub}@clerk.local`;

  return {
    sub,
    email,
    name: verified.name || verified.full_name || verified.given_name,
    preferred_username: verified.preferred_username || verified.username,
    roles: verified.realm_access?.roles || []
  };
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (DEV_AUTH_BYPASS && (!token || token === 'null' || token === 'undefined')) {
    console.warn('DEV_AUTH_BYPASS enabled: allowing request without external token verification');
    setDevUser(req);
    return next();
  }

  if (!token) {
    console.log('Auth failed: No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  console.log('Verifying token...');
  
  // Decode token without verification first to get the issuer
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded) {
    if (DEV_AUTH_BYPASS) {
      console.warn('DEV_AUTH_BYPASS enabled: token could not be decoded, using dev user');
      setDevUser(req);
      return next();
    }
    console.error('Failed to decode token');
    return res.status(401).json({ error: 'Invalid token format' });
  }

  // Validate that token issuer is one of the configured allowed issuers.
  const tokenIssuer = decoded.payload.iss;
  const validIssuers = ISSUER_URLS_FROM_ENV;

  if (!validIssuers.includes(tokenIssuer)) {
    console.error('Invalid issuer:', tokenIssuer);
    console.error('Expected one of:', validIssuers.join(', '));
    return res.status(401).json({ error: 'Invalid token issuer' });
  }

  if (!hasAcceptedAudience(decoded.payload)) {
    console.error('Invalid token audience or client id');
    console.error('Expected one of:', ACCEPTED_AUDIENCES.join(', '));
    return res.status(401).json({ error: 'Invalid token audience' });
  }

  // Now verify with the actual issuer from the token
  jwt.verify(token, getKey, {
    issuer: tokenIssuer,
    algorithms: ['RS256']
  }, (err, verified) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid token', details: err.message });
    }

    console.log('Token verified successfully for user:', verified.preferred_username || verified.sub);

    req.user = normalizeUserFromToken(verified);

    next();
  });
};

const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.user.roles.includes(requiredRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { verifyToken, checkRole };

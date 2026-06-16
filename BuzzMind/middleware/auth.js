const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { roleHome, safeNextUrl } = require('../utils/rolePaths');
// this file for the authentication and authorization middleware functions, including session hydration and role-based access control.
async function hydrateSession(req) {
  if (!req.session?.userId) return false;

  const user = await User.findById(req.session.userId).select('-Password');
  if (!user) return false;

  req.user = user;
  req.session.role = user.Role;
  return true;
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const ok = await hydrateSession(req);
    if (!ok) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Not authenticated' });
    }
    await saveSession(req);
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      if (!req.user) {
        const ok = await hydrateSession(req);
        if (!ok) {
          req.session.destroy(() => {});
          return res.status(401).json({ error: 'Not authenticated' });
        }
      }

      const role = req.session.role || req.user?.Role;
      if (!roles.includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Protect HTML pages.
 * @param {...string} requiredRoles - e.g. 'student', or 'professor','admin' to allow either.
 *   Omit entirely on /role (login only, role may be unset).
 */
function requirePageAuth(...requiredRoles) {
  return async (req, res, next) => {
    if (!req.session?.userId) {
      const nextUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`/login?next=${nextUrl}`);
    }

    try {
      const ok = await hydrateSession(req);
      if (!ok) {
        return req.session.destroy(() => res.redirect('/login'));
      }

      if (!req.session.role && requiredRoles.length) {
        return res.redirect('/role');
      }

      if (
        requiredRoles.length &&
        req.session.role &&
        !requiredRoles.includes(req.session.role)
      ) {
        return res.redirect(roleHome(req.session.role));
      }

      await saveSession(req);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** If already logged in, skip login/signup page. */
async function redirectIfAuthenticated(req, res, next) {
  if (!req.session?.userId) return next();
  if (req.query.error) return next();

  try {
    const ok = await hydrateSession(req);
    if (!ok) {
      return req.session.destroy(() => next());
    }

    const destination =
      safeNextUrl(req.query.next) ||
      (req.session.role ? roleHome(req.session.role) : '/role');
    return res.redirect(destination);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticateToken,
  requireAuth,
  requireRole,
  requirePageAuth,
  redirectIfAuthenticated,
  hydrateSession,
  saveSession,
};

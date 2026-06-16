const session = require('express-session');
const MongoStore = require('connect-mongo');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function createSessionMiddleware() {
  const mongoUrl = process.env.MONGODB_URI;
  const cookieSecure = process.env.COOKIE_SECURE === 'true';

  const options = {
    secret: process.env.SESSION_SECRET || 'buzzmind-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: 'buzzmind.sid',
    cookie: {
      secure: cookieSecure,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SEVEN_DAYS_MS,
      path: '/',
    },
  };

  if (mongoUrl) {
    options.store = MongoStore.create({
      mongoUrl,
      ttl: Math.floor(SEVEN_DAYS_MS / 1000),
      touchAfter: 24 * 3600,
    });
  } else {
    console.warn('MONGODB_URI not set — sessions will not persist across server restarts');
  }

  return session(options);
}

module.exports = { createSessionMiddleware };

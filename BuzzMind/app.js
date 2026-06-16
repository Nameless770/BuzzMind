require('dotenv').config();

const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { createSessionMiddleware } = require('./config/session');
const { hydrateSession } = require('./middleware/auth');
const { Server } = require('socket.io');

const connectDatabase = require('./config/database');

const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const quizRoutes = require('./routes/quizRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const overviewRoutes = require('./routes/overviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3010;
const isProduction = process.env.NODE_ENV === 'production';

// Socket.IO setup
const io = new Server(server, {// Allow CORS for all origins (adjust in production)
  cors: {
    origin: true, // Allow connections from ANY origin
    credentials: true, // Allow cookies/authentication with requests
  },
});

const userSockets = new Map();
// Handle Socket.IO connections and maintain a mapping of userId to socketId
io.on('connection', (socket) => {
  socket.on('user:join', (userId) => {
    if (userId) {
      userSockets.set(String(userId), socket.id);
    }
  });

  socket.on('session:join', (sessionId) => {
    const id = String(sessionId || '').trim();
    if (id) socket.join(`session:${id}`);
  });

  socket.on('session:leave', (sessionId) => {
    const id = String(sessionId || '').trim();
    if (id) socket.leave(`session:${id}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('userSockets', userSockets);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enable trust proxy so secure cookies and IPs work correctly behind a proxy/load balancer.
// This is important on hosts like Render where TLS is terminated before the app.
app.set('trust proxy', 1);

// Log presence of important env vars (do not print secrets)
console.log('ENV:', 'NODE_ENV=', process.env.NODE_ENV || '', 'MONGODB_URI=', !!process.env.MONGODB_URI, 'SESSION_SECRET=', !!process.env.SESSION_SECRET, 'COOKIE_SECURE=', process.env.COOKIE_SECURE || '');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(createSessionMiddleware());
// Middleware to hydrate session with user data if userId exists , async to avoid blocking the request if database is slow or down, errors are caught and logged but do not prevent the request from proceeding
app.use(async (req, res, next) => {
  if (req.session?.userId) {
    try {
      await hydrateSession(req);
    } catch (err) {
      console.error('Session hydrate failed:', err.message);
    }
  }
  next();
});

// Simple request/response logger to help debug deployment issues (prints cookies and session presence)
app.use((req, res, next) => {
  console.log(`REQ ${req.method} ${req.originalUrl} cookie=${req.headers.cookie || ''}`);
  res.on('finish', () => {
    try {
      const sessionExists = !!(req.session && req.session.userId);
      console.log(`RES ${res.statusCode} ${req.method} ${req.originalUrl} sessionUser=${sessionExists}`);
    } catch (e) {
      console.log('RES logger error', e && e.message);
    }
  });
  next();
});

app.get(
  ['/forgot-password', '/forgot-password.html', '/Login Page/forgot-password.html'],
  (req, res) => {
    res.render('Login/forgot-password');
  },
);

app.use(express.static(path.join(__dirname, 'public')));

app.use(pageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);
// 404 handler for API and non-API routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('Page not found');
});
// Global error handler for API and non-API routes, with special handling for Multer errors and upload filter errors
app.use((err, req, res, next) => {
  const isMulter = err && err.name === 'MulterError';
  const isUploadFilter =
    err && /^(Only images allowed|Unsupported file type)/.test(err.message || '');
  if (isMulter || isUploadFilter) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message || 'Upload failed.';
    if (req.path.startsWith('/api/')) return res.status(400).json({ error: msg });
    return res.status(400).send(msg);
  }
  console.error('Global error handler:', err.stack || err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.status(500).send(err.message || 'Error');
});

connectDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`BuzzMind running at http://localhost:${port}/`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

module.exports = { app, server, io, userSockets };

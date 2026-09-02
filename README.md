# BuzzMind
 
A real-time, classroom-focused live quiz platform — think Kahoot, built as a full classroom
companion. Professors create quizzes and classes, students join live quiz sessions with a 6-digit
PIN and compete on a shared leaderboard in real time, and the same platform also handles
assignments, grading, and class communication.
 
Built as a server-rendered Node.js/Express MVC app (EJS views) with a MongoDB backend and
Socket.IO powering everything that needs to update instantly across connected clients.
 
## Contents
 
- [Overview](#overview)
- [Features](#features)
- [Real-time architecture](#real-time-architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Authentication](#authentication)
- [Environment variables](#environment-variables)
- [Local setup](#local-setup)
## Overview
 
BuzzMind has three roles — **admin**, **professor**, and **student** — enforced server-side on
every route. A professor builds a quiz (multiple-choice questions, optional images per question
and per answer, a shared countdown timer), launches it as a **game session**, and gets a 6-digit
join PIN. Students join from any device without needing an account, answer questions in real
time, and see a live leaderboard update as scores come in. Alongside the quiz game, professors
manage classes and post assignments; students submit text or file work and get it graded with
feedback — so the app covers both the "live game" moment and the ongoing coursework around it.
 
## Features
 
**Live quiz sessions**
- 6-digit PIN join flow — no student account required to play
- Real-time question delivery, answer submission, and scoring over Socket.IO
- Shared countdown timer so every player sees the same time remaining
- Live leaderboard, "players answered" progress, and player-joined notifications pushed to the
  host in real time
- Per-session results are persisted (`QuizResult`) and linked back to a student account when one
  matches, so history survives after the session ends
**Classes & assignments**
- Professors create classes and enroll students
- Assignments support text submissions, file attachments, due dates, and late detection
- Grading workflow with per-submission grade + written feedback
- Students see their own submission status, grade, and feedback; professors see submission counts
  and a roster view per assignment
**Accounts & auth**
- Email-verified sign-up: a one-time code is emailed and confirmed *before* the account is created
- Password reset via emailed, expiring, rate-limited one-time codes (hashed at rest, never stored
  in plaintext)
- Outbound verification/reset emails are checked for real deliverability — a DNS MX lookup on the
  recipient domain, SMTP accept/reject inspection, and an optional post-send bounce check that
  polls the sending mailbox over IMAP for a delivery-failure notification
- Session-based auth (`express-session` + MongoDB-backed store) with role-gated page and API
  middleware; a JWT verification path also exists for token-based API access
- bcrypt password hashing, with transparent upgrade of any legacy plaintext password on next login
**Admin & reporting**
- Admin oversight across users, classes, quizzes, and sessions
- Quiz-result history, scoped per role (a student sees their own results; staff see the platform view)
- Contact/support messages, pushed to connected admins in real time via Socket.IO
- In-app chat between users
## Real-time architecture
 
A single Socket.IO server (attached to the same HTTP server as Express) drives everything that
needs to feel instant:
 
- Each connected client maps its `userId` to a socket, so the server can push events straight to
  one person (e.g. notifying a professor the moment a student joins their session)
- Game sessions use Socket.IO rooms (`session:<id>`) — joining a session subscribes a socket to
  that room, and the server broadcasts `session:started`, `session:questionChanged`,
  `session:answerSubmitted`, and `session:ended` events to everyone in it
- Scoring, the leaderboard, and the shared countdown are computed server-side and re-broadcast, so
  clients never trust each other's state
- The same mechanism powers live admin notifications for new contact messages
## Tech stack
 
| Layer | Technology |
|---|---|
| Views | EJS templates, server-rendered |
| Backend | Node.js, Express 5 |
| Real-time | Socket.IO |
| Database | MongoDB with Mongoose |
| Sessions | `express-session` + `connect-mongo` (MongoDB-backed session store) |
| Auth | Session cookies (primary) + JWT verification path; bcrypt password hashing |
| Email | Nodemailer (SMTP/service transport) + ImapFlow (bounce detection over IMAP) |
| File uploads | Multer |
| Dev tooling | Nodemon |
 
## Project structure
 
```
BuzzMind/
├── app.js                 Express app + HTTP server + Socket.IO wiring, entry point
├── config/
│   ├── database.js        Mongoose connection
│   ├── session.js         express-session + connect-mongo store config
│   └── mailer.js          Nodemailer transport, MX/bounce deliverability checks
├── controllers/           HTTP request handlers (auth, pages)
├── middleware/            Session hydration, requireAuth / requireRole guards
├── models/                Mongoose schemas: User, Class, Quiz, GameSession, QuizResult,
│                           Assignment, Submission, ChatMessage, ContactMessage
├── routes/                One router per resource, mounted under /api/*
├── scripts/                Maintenance scripts (e.g. create-admin)
├── utils/                  Password hashing, PIN generation, role-based redirect helpers
├── public/                  Static client assets
└── views/                   EJS templates (login, role-specific dashboards, quiz UI, etc.)
```
 
## Authentication
 
Auth is session-first: `express-session` issues an httpOnly, `sameSite=lax` cookie backed by a
MongoDB session store, so sessions survive server restarts and scale across processes. On each
request, `hydrateSession` loads the current user from the session's `userId` and attaches
`req.user` / `req.session.role`. Route-level guards (`requireAuth`, `requireRole(...roles)`) and
page-level guards (`requirePageAuth`) enforce access before a handler ever runs — including
redirecting an unauthenticated request to `/login?next=...` and sending an already-authenticated
visitor straight to their role's home page.
 
Sign-up requires proving ownership of the email address first: a six-digit code is emailed and
must be verified in the same session before the account row is ever created. Password resets
follow the same emailed-code pattern, with codes hashed before storage, a cooldown between resend
attempts, and a 15-minute expiry. A separate JWT-based `authenticateToken` middleware is also
available for bearer-token API access alongside the cookie session.
 
## Environment variables
 
All configuration is read from environment variables (a local `server`/`.env` file works with
`dotenv`).
 
| Variable | Required | Description |
|---|---|---|
| `PORT` | no (3010) | HTTP listen port |
| `NODE_ENV` | no | `development` / `production` |
| `MONGODB_URI` | yes | MongoDB connection string |
| `SESSION_SECRET` | recommended | Session cookie signing secret |
| `COOKIE_SECURE` | no | Set `true` behind HTTPS to mark cookies secure |
| `JWT_SECRET` | for token auth | Signing secret for the JWT bearer-token path |
| `MAIL_SERVICE` or `MAIL_HOST` / `MAIL_PORT` / `MAIL_SECURE` | for email features | Outbound mail transport |
| `MAIL_USER` / `MAIL_PASS` | for email features | Mailbox credentials used to send verification/reset codes |
| `MAIL_FROM` / `MAIL_REPLY_TO` | no | Display name/address overrides for outgoing mail |
| `MAIL_BOUNCE_CHECK` | no | Force-enable/disable the post-send IMAP bounce check (auto-on for Gmail sender accounts) |
| `MAIL_IMAP_HOST` / `MAIL_IMAP_USER` / `MAIL_IMAP_PASS` / `MAIL_IMAP_PORT` / `MAIL_IMAP_SECURE` | for bounce checking | IMAP credentials for polling the sender's mailbox for bounces |
| `MAIL_BOUNCE_MAILBOXES` | no | Comma-separated mailbox names to search for bounces |
 
Without mail configuration, email verification and password reset endpoints respond with a clear
"email service is not configured" error rather than crashing.
 
## Local setup
 
Prerequisites: Node.js and a MongoDB instance (local or Atlas).
 
```bash
# from the BuzzMind/ app directory
npm install
 
cp .env.example .env   # create and fill in .env if no example is present
npm run dev             # nodemon, auto-restarts on changes
# or
npm start                # node app.js
```
 
Useful scripts:
 
| Command | Purpose |
|---|---|
| `npm start` | Run the app with Node |
| `npm run dev` | Run with Nodemon for local development |
| `npm run create-admin` | Seed/promote an admin account via `scripts/create-admin.js` |
 
The app serves both the EJS-rendered pages and the JSON API from the same Express server —
there's no separate frontend build step.
 

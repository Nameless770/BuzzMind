const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { roleHome, safeNextUrl } = require('../utils/rolePaths');
const { sendResetCodeEmail, sendSignupVerificationEmail } = require('../config/mailer');
const crypto = require('crypto');

const RESET_CODE_EXPIRES_MS = 15 * 60 * 1000;
const RESET_CODE_COOLDOWN_MS = 30 * 1000;
const SIGNUP_CODE_EXPIRES_MS = RESET_CODE_EXPIRES_MS;
const SIGNUP_CODE_COOLDOWN_MS = RESET_CODE_COOLDOWN_MS;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateResetCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function findUserByEmailOrUsername(emailOrUsername) {
  const identifier = (emailOrUsername || '').trim();
  if (!identifier) return null;

  return User.findOne({
    $or: [{ Email: identifier.toLowerCase() }, { Username: identifier }],
  });
}

function passwordResetSendError(error) {
  if (error.message === 'Email service is not configured.') {
    return { status: 500, message: 'Email service is not configured.' };
  }

  if (error.code === 'EMAIL_UNREACHABLE') {
    return { status: 400, message: 'Destination email address is unreachable.' };
  }

  return { status: 500, message: 'Error sending reset code.' };
}

function signupVerificationSendError(error) {
  const sendError = passwordResetSendError(error);
  if (sendError.message === 'Error sending reset code.') {
    return { status: sendError.status, message: 'Error sending verification code.' };
  }
  return sendError;
}

function normalizeSignupEmail(email) {
  return (email || '').trim().toLowerCase();
}

function validateSignupInput({ Name, Username, Password, Email }) {
  if (!Name?.trim() || !Username?.trim() || !Password || !Email?.trim()) {
    return 'Please fill in all sign-up fields.';
  }

  if (Name.trim().length < 3) {
    return 'Name must be at least 3 chars.';
  }

  if (Username.trim().length < 3) {
    return 'Username must be at least 3 chars.';
  }

  if (!EMAIL_RE.test(normalizeSignupEmail(Email))) {
    return 'Please enter a valid email.';
  }

  if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(Password || '')) {
    return 'Password needs 8 chars, one uppercase, and one number.';
  }

  return '';
}

async function findExistingSignupUser(email, username) {
  return User.findOne({
    $or: [{ Email: email }, { Username: username }],
  });
}

function clearSignupVerification(req) {
  if (req.session) {
    delete req.session.signupEmailVerification;
  }
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }

    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function verifySignupCode(req, email, code) {
  const verification = req.session?.signupEmailVerification;
  if (!verification || verification.Email !== email) {
    return { ok: false, error: 'email_code_required' };
  }

  if (new Date(verification.ExpiresAt).getTime() < Date.now()) {
    clearSignupVerification(req);
    return { ok: false, error: 'email_code_expired' };
  }

  if (!code?.trim()) {
    return { ok: false, error: 'email_code_required' };
  }

  const codeMatches = await verifyPassword(code.trim(), verification.Code);
  if (!codeMatches) {
    return { ok: false, error: 'email_code_invalid' };
  }

  return { ok: true };
}

function destroySession(req, onDone) {
  if (!req.session) {
    onDone();
    return;
  }

  req.session.destroy(() => onDone());
}

function getCurrentUser(req, res) {
  res.json({
    id: req.user._id,
    name: req.user.Name,
    username: req.user.Username,
    email: req.user.Email,
    role: req.user.Role,
    department: req.user.Department,
    avatarUrl: req.user.AvatarUrl || '',
  });
}

function logoutApi(req, res) {
  destroySession(req, () => {
    res.json({ success: true });
  });
}

function logoutPage(req, res) {
  destroySession(req, () => {
    res.redirect('/');
  });
}

function redirectWithSession(req, res, target) {
  if (!req.session) {
    res.redirect(target);
    return;
  }

  req.session.save((err) => {
    if (err) {
      console.error('Error saving session:', err);
      res.status(500).send('Error');
      return;
    }
    res.redirect(target);
  });
}

function redirectAfterAuth(req, res, user) {
  const nextUrl = safeNextUrl(req.body.next || req.query.next);
  if (nextUrl) {
    return redirectWithSession(req, res, nextUrl);
  }
  if (user.Role === 'professor') return redirectWithSession(req, res, '/professor');
  if (user.Role === 'student') return redirectWithSession(req, res, '/student');
  if (user.Role === 'admin') return redirectWithSession(req, res, '/admin');
  return redirectWithSession(req, res, '/role');
}

function redirectToLoginWithError(req, res, code) {
  const role = req.body.preferredRole || req.query.role || '';
  const roleQs = role ? `&role=${encodeURIComponent(role)}` : '';
  const target = `/login?error=${code}${roleQs}`;

  if (!req.session) {
    return res.redirect(target);
  }
  req.session.destroy(() => res.redirect(target));
}

async function registerUser(req, res) {
  try {
    const { Name, Username, Password, Email, preferredRole, signupCode } = req.body;

    if (validateSignupInput({ Name, Username, Password, Email })) {
      return redirectToLoginWithError(req, res, 'missing_fields');
    }

    const emailNorm = normalizeSignupEmail(Email);
    const usernameTrim = Username.trim();
    const existingUser = await findExistingSignupUser(emailNorm, usernameTrim);

    if (existingUser) {
      if (existingUser.Email === emailNorm) {
        return redirectToLoginWithError(req, res, 'email_exists');
      }
      if (existingUser.Username === usernameTrim) {
        return redirectToLoginWithError(req, res, 'username_exists');
      }
      return redirectToLoginWithError(req, res, 'user_exists');
    }

    const signupVerification = await verifySignupCode(req, emailNorm, signupCode);
    if (!signupVerification.ok) {
      return redirectToLoginWithError(req, res, signupVerification.error);
    }

    const hashedPassword = await hashPassword(Password);
    const userData = {
      Name: Name.trim(),
      Username: usernameTrim,
      Password: hashedPassword,
      Email: emailNorm,
    };

    // If the signup came with a preferred role (from ?role=...), apply it if valid.
    // Only student/professor are self-selectable; admin is never publicly assignable.
    if (preferredRole && ['professor', 'student'].includes(preferredRole)) {
      userData.Role = preferredRole;
    }

    const user = await User.create(userData);

    clearSignupVerification(req);
    req.session.userId = user._id.toString();
    req.session.role = user.Role;

    return redirectAfterAuth(req, res, user);
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error');
  }
}

async function loginUser(req, res) {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({
      $or: [{ Email: emailOrUsername }, { Username: emailOrUsername }],
    });

    if (!user) {
      return res.redirect('/login?error=user_not_found');
    }

    const passwordMatches = await verifyPassword(password, user.Password);
    if (!passwordMatches) {
      return res.redirect('/login?error=wrong_password');
    }

    if (!user.Password.startsWith('$2')) {
      user.Password = await hashPassword(password);
      await user.save();
    }

    req.session.userId = user._id.toString();
    req.session.role = user.Role;

    return redirectAfterAuth(req, res, user);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error');
  }
}

async function setRole(req, res) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const { role } = req.body;

    if (!role || !['professor', 'student'].includes(role)) {
      return res.redirect('/role?error=missing_role');
    }

    await User.findByIdAndUpdate(req.session.userId, { Role: role });
    req.session.role = role;

    return redirectAfterAuth(req, res, { Role: role });
  } catch (error) {
    console.error('Error setting role:', error);
    res.status(500).send('Error');
  }
}

async function sendSignupVerificationCode(req, res) {
  try {
    const { Name, Username, Password, Email } = req.body;
    const validationError = validateSignupInput({ Name, Username, Password, Email });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const emailNorm = normalizeSignupEmail(Email);
    const usernameTrim = Username.trim();
    const existingUser = await findExistingSignupUser(emailNorm, usernameTrim);

    if (existingUser) {
      if (existingUser.Email === emailNorm) {
        return res.status(409).json({ error: 'That email is already registered.' });
      }
      if (existingUser.Username === usernameTrim) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }
      return res.status(409).json({ error: 'Email or username already exists.' });
    }

    const now = Date.now();
    const currentVerification = req.session?.signupEmailVerification;
    const lastSent =
      currentVerification?.Email === emailNorm && currentVerification.SentAt
        ? new Date(currentVerification.SentAt).getTime()
        : 0;
    const remainingCooldown = SIGNUP_CODE_COOLDOWN_MS - (now - lastSent);

    if (remainingCooldown > 0) {
      return res.status(429).json({
        error: 'Please wait before sending another code.',
        retryAfter: Math.ceil(remainingCooldown / 1000),
      });
    }

    const code = generateResetCode();
    await sendSignupVerificationEmail(emailNorm, code);

    const sentAt = Date.now();
    req.session.signupEmailVerification = {
      Email: emailNorm,
      Code: await hashPassword(code),
      ExpiresAt: new Date(sentAt + SIGNUP_CODE_EXPIRES_MS).toISOString(),
      SentAt: new Date(sentAt).toISOString(),
    };
    await saveSession(req);

    return res.json({
      success: true,
      message: 'Verification code sent to your email. It expires in 15 minutes.',
      retryAfter: SIGNUP_CODE_COOLDOWN_MS / 1000,
      expiresIn: SIGNUP_CODE_EXPIRES_MS / 1000,
    });
  } catch (error) {
    console.error('Error sending signup verification code:', error);
    const sendError = signupVerificationSendError(error);
    return res.status(sendError.status).json({ error: sendError.message });
  }
}

async function sendPasswordResetCode(req, res) {
  try {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername?.trim()) {
      return res.status(400).json({ error: 'Enter your email or username.' });
    }

    const user = await findUserByEmailOrUsername(emailOrUsername);

    if (!user) {
      return res.status(404).json({ error: 'No account found with that email or username.' });
    }

    const now = Date.now();
    const lastSent = user.PasswordResetCodeSentAt
      ? user.PasswordResetCodeSentAt.getTime()
      : 0;
    const remainingCooldown = RESET_CODE_COOLDOWN_MS - (now - lastSent);

    if (remainingCooldown > 0) {
      return res.status(429).json({
        error: 'Please wait before sending another code.',
        retryAfter: Math.ceil(remainingCooldown / 1000),
      });
    }

    const code = generateResetCode();
    user.PasswordResetCode = await hashPassword(code);
    user.PasswordResetCodeExpiresAt = new Date(now + RESET_CODE_EXPIRES_MS);
    user.PasswordResetCodeSentAt = new Date(now);
    await user.save();

    try {
      await sendResetCodeEmail(user, code);
    } catch (emailError) {
      user.PasswordResetCode = null;
      user.PasswordResetCodeExpiresAt = null;
      user.PasswordResetCodeSentAt = null;
      await user.save();
      throw emailError;
    }

    const payload = {
      success: true,
      message: 'Verification code sent to your email. It expires in 15 minutes.',
      retryAfter: RESET_CODE_COOLDOWN_MS / 1000,
      expiresIn: RESET_CODE_EXPIRES_MS / 1000,
    };

    return res.json(payload);
  } catch (error) {
    console.error('Error sending password reset code:', error);
    const sendError = passwordResetSendError(error);
    return res.status(sendError.status).json({ error: sendError.message });
  }
}

async function verifyPasswordResetCode(req, res) {
  try {
    const { emailOrUsername, code, newPassword } = req.body;
    const user = await findUserByEmailOrUsername(emailOrUsername);

    if (!user) {
      return res.status(404).json({ error: 'No account found with that email or username.' });
    }

    if (!code?.trim() || !user.PasswordResetCode || !user.PasswordResetCodeExpiresAt) {
      return res.status(400).json({ error: 'Please request a code first.' });
    }

    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(newPassword || '')) {
      return res.status(400).json({
        error: 'Password needs 8 chars, one uppercase, and one number.',
      });
    }

    if (user.PasswordResetCodeExpiresAt.getTime() < Date.now()) {
      user.PasswordResetCode = null;
      user.PasswordResetCodeExpiresAt = null;
      await user.save();
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }

    const codeMatches = await verifyPassword(code.trim(), user.PasswordResetCode);
    if (!codeMatches) {
      return res.status(400).json({ error: 'Invalid code.' });
    }

    user.PasswordResetCode = null;
    user.PasswordResetCodeExpiresAt = null;
    user.PasswordResetCodeSentAt = null;
    user.Password = await hashPassword(newPassword);
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully. You can login now.' });
  } catch (error) {
    console.error('Error verifying password reset code:', error);
    return res.status(500).json({ error: 'Error verifying reset code.' });
  }
}

module.exports = {
  getCurrentUser,
  loginUser,
  logoutApi,
  logoutPage,
  registerUser,
  sendPasswordResetCode,
  sendSignupVerificationCode,
  setRole,
  verifyPasswordResetCode,
};

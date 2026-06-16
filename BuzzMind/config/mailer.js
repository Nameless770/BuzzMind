const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const { ImapFlow } = require("imapflow");
const EMAIL_UNREACHABLE_MESSAGE = 'Destination email address is unreachable.';
const DEFAULT_BOUNCE_CHECK_MS = 2000;
const BOUNCE_POLL_MS = 500;
const BOUNCE_SEARCH_FUZZ_MS = 5000;
const MAX_FETCHED_BOUNCE_MESSAGES = 80;

function createMailError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createTransporter() {
  if (process.env.MAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

function hasMailConfig() {
  return Boolean(
    process.env.MAIL_USER &&
      process.env.MAIL_PASS &&
      (process.env.MAIL_SERVICE || process.env.MAIL_HOST),
  );
}

function readPositiveInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeEmailAddress(email) {
  return String(email || '').trim().toLowerCase();
}

function cleanHeaderText(value) {
  return String(value || '').replace(/[\r\n"]/g, '').trim();
}

function mailFromAddress() {
  const configuredFrom = String(process.env.MAIL_FROM || '').trim();
  const mailUser = normalizeEmailAddress(process.env.MAIL_USER);

  if (configuredFrom.includes('<') && configuredFrom.includes('>')) {
    return configuredFrom;
  }

  if (isValidEmailAddress(configuredFrom)) {
    return `"BuzzMind Team" <${configuredFrom}>`;
  }

  const displayName = cleanHeaderText(configuredFrom) || 'BuzzMind Team';
  return `"${displayName}" <${mailUser}>`;
}

function isValidEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function assertReachableEmailAddress(email) {
  const normalizedEmail = normalizeEmailAddress(email);
  if (!isValidEmailAddress(normalizedEmail)) {
    throw createMailError(EMAIL_UNREACHABLE_MESSAGE, 'EMAIL_UNREACHABLE');
  }

  const domain = normalizedEmail.split('@').pop();
  try {
    const records = await dns.resolveMx(domain);
    const hasUsableMailServer = records.some((record) => record.exchange && record.exchange !== '.');
    if (!hasUsableMailServer) {
      throw createMailError(EMAIL_UNREACHABLE_MESSAGE, 'EMAIL_UNREACHABLE');
    }
  } catch (error) {
    if (error.code === 'EMAIL_UNREACHABLE') throw error;
    if (['ENODATA', 'ENOTFOUND', 'ENODOMAIN'].includes(error.code)) {
      throw createMailError(EMAIL_UNREACHABLE_MESSAGE, 'EMAIL_UNREACHABLE');
    }
  }

  return normalizedEmail;
}

function isTrueSetting(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function isFalseSetting(value) {
  return ['0', 'false', 'no', 'off'].includes(String(value || '').trim().toLowerCase());
}

function shouldCheckBounceInbox() {
  if (isFalseSetting(process.env.MAIL_BOUNCE_CHECK)) return false;
  if (isTrueSetting(process.env.MAIL_BOUNCE_CHECK)) return true;

  return (
    /gmail/i.test(process.env.MAIL_SERVICE || '') ||
    /@gmail\.com$/i.test(normalizeEmailAddress(process.env.MAIL_USER))
  );
}

function bounceMailboxNames() {
  const configured = String(process.env.MAIL_BOUNCE_MAILBOXES || '')
    .split(',')
    .map((mailbox) => mailbox.trim())
    .filter(Boolean);

  return configured.length ? configured : ['INBOX', '[Gmail]/All Mail'];
}

function createBounceImapClient() {
  const isGmail =
    /gmail/i.test(process.env.MAIL_SERVICE || '') ||
    /@gmail\.com$/i.test(normalizeEmailAddress(process.env.MAIL_USER));
  const host = process.env.MAIL_IMAP_HOST || (isGmail ? 'imap.gmail.com' : '');
  const user = process.env.MAIL_IMAP_USER || process.env.MAIL_USER;
  const pass = process.env.MAIL_IMAP_PASS || process.env.MAIL_PASS;

  if (!host || !user || !pass) return null;

  const client = new ImapFlow({
    host,
    port: readPositiveInt('MAIL_IMAP_PORT', 993),
    secure: !isFalseSetting(process.env.MAIL_IMAP_SECURE),
    auth: { user, pass },
    logger: false,
  });

  client.on('error', (error) => {
    console.warn('Email bounce check IMAP error:', error.message);
  });

  return client;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function envelopeAddresses(envelope) {
  return [envelope?.from, envelope?.sender, envelope?.replyTo].flat().filter(Boolean);
}

function addressText(address) {
  return [address.name, address.address].filter(Boolean).join(' ').toLowerCase();
}

function isDeliveryFailureSender(envelope) {
  return envelopeAddresses(envelope).some((address) =>
    /mailer-daemon|postmaster|mail delivery subsystem|delivery subsystem/.test(addressText(address)),
  );
}

function isDeliveryFailureText(subject, source) {
  return /address not found|message wasn't delivered|message was not delivered|could not be delivered|couldn't be found|unable to receive email|recipient address rejected|user unknown|no such user|mailbox unavailable|delivery has failed|undeliverable|delivery status notification/i.test(
    `${subject}\n${source}`,
  );
}

function isBounceForRecipient(message, recipient, sentAt) {
  const internalDate = message.internalDate instanceof Date ? message.internalDate : new Date();
  if (internalDate.getTime() < sentAt.getTime() - BOUNCE_SEARCH_FUZZ_MS) {
    return false;
  }

  const source = message.source ? message.source.toString('utf8') : '';
  const sourceLower = source.toLowerCase();
  const subject = message.envelope?.subject || '';
  const recipientLower = normalizeEmailAddress(recipient);

  return (
    sourceLower.includes(recipientLower) &&
    (isDeliveryFailureSender(message.envelope) || isDeliveryFailureText(subject, source))
  );
}

async function findRecentBounce(client, recipient, sentAt) {
  const since = new Date(sentAt.getTime() - BOUNCE_SEARCH_FUZZ_MS);
  const uids = await client.search({ since }, { uid: true });
  if (!uids || !uids.length) return false;

  const recentUids = uids.slice(-MAX_FETCHED_BOUNCE_MESSAGES);
  for await (const message of client.fetch(
    recentUids,
    { envelope: true, internalDate: true, source: { maxLength: 200000 } },
    { uid: true },
  )) {
    if (isBounceForRecipient(message, recipient, sentAt)) {
      return true;
    }
  }

  return false;
}

async function findRecentBounceInMailboxes(client, recipient, sentAt, mailboxes, unavailableMailboxes) {
  for (const mailbox of mailboxes) {
    if (unavailableMailboxes.has(mailbox)) continue;

    let lock;
    try {
      lock = await client.getMailboxLock(mailbox);
      if (await findRecentBounce(client, recipient, sentAt)) {
        return true;
      }
    } catch (error) {
      unavailableMailboxes.add(mailbox);
      console.warn(`Email bounce check skipped mailbox "${mailbox}":`, error.message);
    } finally {
      if (lock) lock.release();
    }
  }

  return false;
}

async function waitForBounceAfterSend(recipient, sentAt) {
  if (!shouldCheckBounceInbox()) return false;

  const waitMs = readPositiveInt('MAIL_BOUNCE_CHECK_MS', DEFAULT_BOUNCE_CHECK_MS);
  if (!waitMs) return false;

  const client = createBounceImapClient();
  if (!client) return false;

  try {
    await client.connect();

    const deadline = Date.now() + waitMs;
    const mailboxes = bounceMailboxNames();
    const unavailableMailboxes = new Set();
    while (Date.now() <= deadline) {
      if (await findRecentBounceInMailboxes(client, recipient, sentAt, mailboxes, unavailableMailboxes)) {
        return true;
      }

      const delay = Math.min(BOUNCE_POLL_MS, deadline - Date.now());
      if (delay <= 0) break;
      await sleep(delay);
    }
  } catch (error) {
    console.warn('Email bounce check skipped:', error.message);
  } finally {
    await client.logout().catch(() => {});
  }

  return false;
}

function isRecipientRejection(error) {
  const responseCode = Number(error.responseCode || 0);
  const command = String(error.command || '').toUpperCase();
  const code = String(error.code || '').toUpperCase();
  const message = String(error.message || '').toLowerCase();

  return (
    code === 'EENVELOPE' ||
    command === 'RCPT TO' ||
    [550, 551, 553].includes(responseCode) ||
    /recipient|mailbox|user unknown|no such user|address rejected|invalid address/.test(message)
  );
}

async function sendCodeEmail(toEmail, code, options) {
  if (!hasMailConfig()) {
    throw new Error('Email service is not configured.');
  }

  const transporter = createTransporter();
  const from = mailFromAddress();
  const replyTo = process.env.MAIL_REPLY_TO || process.env.MAIL_USER;
  const to = await assertReachableEmailAddress(toEmail);
  const subject = options.subject;
  const heading = options.heading;
  const intro = options.intro;
  const text = options.text;

  try {
    const sentAt = new Date();
    const info = await transporter.sendMail({
      from,
      replyTo,
      envelope: {
        from: process.env.MAIL_USER,
        to,
      },
      to,
      subject,
      text,
      headers: {
        'X-BuzzMind-Mail-Type': options.type || 'verification-code',
      },
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1035;">
          <h2>${heading}</h2>
          <p>${intro}</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
          <p>This code expires in 15 minutes.</p>
          <p>If you did not request this code, you can ignore this email.</p>
        </div>
      `,
    });

    const rejected = (info.rejected || []).map(normalizeEmailAddress);
    const accepted = (info.accepted || []).map(normalizeEmailAddress);
    if (rejected.includes(to) || (!accepted.length && rejected.length)) {
      throw createMailError(EMAIL_UNREACHABLE_MESSAGE, 'EMAIL_UNREACHABLE');
    }

    if (await waitForBounceAfterSend(to, sentAt)) {
      throw createMailError(EMAIL_UNREACHABLE_MESSAGE, 'EMAIL_UNREACHABLE');
    }

    return info;
  } catch (error) {
    if (error.code === 'EMAIL_UNREACHABLE') throw error;
    if (isRecipientRejection(error)) {
      throw createMailError(EMAIL_UNREACHABLE_MESSAGE, 'EMAIL_UNREACHABLE');
    }
    throw error;
  }
}

function sendResetCodeEmail(user, code) {
  return sendCodeEmail(user.Email, code, {
    type: 'password-reset',
    subject: 'BuzzMind password reset code',
    heading: 'BuzzMind Password Reset',
    intro: 'Your password reset code is:',
    text: `Your BuzzMind password reset code is ${code}. This code expires in 15 minutes.\n\nIf you did not request this code, you can ignore this email.`,
  });
}

function sendSignupVerificationEmail(email, code) {
  return sendCodeEmail(email, code, {
    type: 'signup-verification',
    subject: 'BuzzMind email verification code',
    heading: 'BuzzMind Email Verification',
    intro: 'Your signup verification code is:',
    text: `Your BuzzMind signup verification code is ${code}. This code expires in 15 minutes.\n\nIf you did not request this code, you can ignore this email.`,
  });
}

module.exports = { sendResetCodeEmail, sendSignupVerificationEmail };

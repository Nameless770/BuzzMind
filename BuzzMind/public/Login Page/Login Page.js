document.addEventListener('DOMContentLoaded', function () {
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn = document.getElementById('login-btn');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const signupAccountForm = document.getElementById('signup-account-form');
  const forgotPasswordForm = document.getElementById('forgot-password-form');

  function showSignup() {
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
    signupForm.style.display = '';
    loginForm.style.display = 'none';
  }

  function showLogin() {
    signupBtn.classList.remove('active');
    loginBtn.classList.add('active');
    signupForm.style.display = 'none';
    loginForm.style.display = '';
  }

  if (signupBtn && loginBtn) {
    signupBtn.addEventListener('click', showSignup);
    loginBtn.addEventListener('click', showLogin);
  }

  // If the URL contains an error or role query, auto-select the appropriate tab
  try {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const role = params.get('role');
    if (role) {
      showSignup();
    } else if (error) {
      // Show login tab for authentication errors, signup for registration errors
      const loginErrors = [
        'user_not_found',
        'wrong_password',
        'invalid_credentials',
      ];
      if (loginErrors.includes(error)) showLogin();
      else showSignup();
    }
  } catch (e) {
    // ignore URL parsing errors
  }

  if (forgotPasswordForm) {
    setupForgotPasswordForm(forgotPasswordForm);
  }

  if (signupAccountForm) {
    setupSignupVerification(signupAccountForm);
  }
});

function setupSignupVerification(form) {
  const nameInput = document.getElementById('fullname');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const codeInput = document.getElementById('signup-code');
  const sendCodeBtn = document.getElementById('signup-send-code-btn');
  const codeError = document.getElementById('signup-code-error');
  const timerText = document.getElementById('signup-code-timer');
  const statusText = document.getElementById('signup-status');
  let timerId = null;
  let verifiedEmail = '';

  function setStatus(message, type) {
    statusText.textContent = message || '';
    statusText.className = `reset-status ${type || ''}`.trim();
  }

  function currentEmail() {
    return emailInput.value.trim().toLowerCase();
  }

  function resetSendButton(message) {
    clearInterval(timerId);
    timerId = null;
    sendCodeBtn.disabled = false;
    sendCodeBtn.textContent = 'Send Email Code';
    timerText.textContent = message || '';
  }

  function startTimer(seconds) {
    let remaining = seconds;
    clearInterval(timerId);
    sendCodeBtn.disabled = true;

    function renderTimer() {
      sendCodeBtn.textContent = `Send Email Code (${remaining}s)`;
      timerText.textContent = `You can send another code after ${remaining}s.`;
    }

    renderTimer();
    timerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerId);
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = 'Send Email Code';
        timerText.textContent = 'You can send another code now.';
        return;
      }
      renderTimer();
    }, 1000);
  }

  emailInput.addEventListener('input', () => {
    if (verifiedEmail && verifiedEmail !== currentEmail()) {
      verifiedEmail = '';
      codeInput.value = '';
      codeError.textContent = '';
      setStatus('Send a verification code to the new email.', '');
      resetSendButton('');
    }
  });

  sendCodeBtn.addEventListener('click', async function () {
    if (!validateSignup()) {
      verifiedEmail = '';
      setStatus('Fix the sign-up fields first.', 'error');
      resetSendButton('');
      return;
    }

    const payload = {
      Name: nameInput.value.trim(),
      Username: usernameInput.value.trim(),
      Email: currentEmail(),
      Password: passwordInput.value,
    };

    codeError.textContent = '';
    setStatus('Checking email...', '');
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = 'Send Email Code';
    timerText.textContent = '';

    try {
      const response = await fetch('/api/auth/signup/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || 'Could not send verification code.', 'error');
        if (data.retryAfter) {
          verifiedEmail = payload.Email;
          startTimer(data.retryAfter);
        } else {
          verifiedEmail = '';
          resetSendButton('');
        }
        return;
      }

      verifiedEmail = payload.Email;
      codeInput.value = '';
      setStatus(data.message, 'success');
      startTimer(Number(data.retryAfter) || 30);
    } catch (error) {
      verifiedEmail = '';
      setStatus('Could not send verification code. Please try again.', 'error');
      resetSendButton('');
    }
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!validateSignup()) {
      setStatus('Fix the sign-up fields first.', 'error');
      return;
    }

    if (!verifiedEmail || verifiedEmail !== currentEmail()) {
      codeError.textContent = 'Send a verification code to this email first';
      setStatus('Verify your email before creating the account.', 'error');
      return;
    }

    if (!codeInput.value.trim()) {
      codeError.textContent = 'Type the email verification code';
      setStatus('Type the code from your email first.', 'error');
      return;
    }

    codeError.textContent = '';
    setStatus('Creating account...', '');
    HTMLFormElement.prototype.submit.call(form);
  });
}

function setupForgotPasswordForm(form) {
  const identifierInput = document.getElementById('reset-email-or-username');
  const codeInput = document.getElementById('reset-code');
  const newPasswordInput = document.getElementById('reset-new-password');
  const confirmPasswordInput = document.getElementById('reset-confirm-password');
  const sendCodeBtn = document.getElementById('send-code-btn');
  const verifyCodeBtn = document.getElementById('verify-code-btn');
  const idError = document.getElementById('reset-id-error');
  const timerText = document.getElementById('reset-timer');
  const statusText = document.getElementById('reset-status');
  let timerId = null;

  function setStatus(message, type) {
    statusText.textContent = message || '';
    statusText.className = `reset-status ${type || ''}`.trim();
  }

  function resetSendButton(message) {
    clearInterval(timerId);
    timerId = null;
    sendCodeBtn.disabled = false;
    sendCodeBtn.textContent = 'Send Code';
    timerText.textContent = message || '';
  }

  function startTimer(seconds) {
    let remaining = seconds;
    clearInterval(timerId);
    sendCodeBtn.disabled = true;

    function renderTimer() {
      sendCodeBtn.textContent = `Send Code (${remaining}s)`;
      timerText.textContent = `You can send another code after ${remaining}s.`;
    }

    renderTimer();
    timerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerId);
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = 'Send Code';
        timerText.textContent = 'You can send another code now.';
        return;
      }
      renderTimer();
    }, 1000);
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const emailOrUsername = identifierInput.value.trim();
    if (!emailOrUsername) {
      idError.textContent = 'Enter your email or username';
      setStatus('', '');
      resetSendButton('');
      return;
    }

    idError.textContent = '';
    setStatus('Checking account...', '');
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = 'Send Code';
    timerText.textContent = '';

    try {
      const response = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || 'Could not send code.', 'error');
        if (data.retryAfter) startTimer(data.retryAfter);
        else resetSendButton('');
        return;
      }

      setStatus(data.message, 'success');
      startTimer(Number(data.retryAfter) || 30);
    } catch (error) {
      setStatus('Could not send code. Please try again.', 'error');
      resetSendButton('');
    }
  });

  verifyCodeBtn.addEventListener('click', async function () {
    const emailOrUsername = identifierInput.value.trim();
    const code = codeInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const passRe = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

    if (!emailOrUsername) {
      idError.textContent = 'Enter your email or username';
      return;
    }

    if (!code) {
      setStatus('Type the code first.', 'error');
      return;
    }

    if (!passRe.test(newPassword)) {
      setStatus('Password needs 8 chars, one uppercase, and one number.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match.', 'error');
      return;
    }

    setStatus('Resetting password...', '');

    try {
      const response = await fetch('/api/auth/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, code, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || 'Invalid code.', 'error');
        return;
      }

      setStatus(data.message || 'Password reset successfully. You can login now.', 'success');
    } catch (error) {
      setStatus('Could not reset password. Please try again.', 'error');
    }
  });
}

function validateSignup() {
  let ok = true;
  const name = document.getElementById('fullname').value || '';
  if (name.length < 3) {
    document.getElementById('nvir').innerHTML = 'Name must be at least 3 chars';
    ok = false;
  } else {
    document.getElementById('nvir').innerHTML = '';
  }

  const username = document.getElementById('username').value || '';
  if (username.length < 3) {
    document.getElementById('unvir').innerHTML =
      'Username must be at least 3 chars';
    ok = false;
  } else {
    document.getElementById('unvir').innerHTML = '';
  }

  const email = document.getElementById('email').value || '';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    document.getElementById('evir').innerHTML = 'Please enter a valid email';
    ok = false;
  } else {
    document.getElementById('evir').innerHTML = '';
  }

  const pass = document.getElementById('password').value || '';
  const passRe = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
  if (!passRe.test(pass)) {
    document.getElementById('pvir').innerHTML =
      'At least 8 chars, one uppercase, one number';
    ok = false;
  } else {
    document.getElementById('pvir').innerHTML = '';
  }

  return ok;
}

function validateLogin() {
  let ok = true;
  const id = document.getElementById('emailOrUsername').value || '';
  const pw = document.getElementById('login-password').value || '';
  if (!id.trim()) {
    document.getElementById('login-vir').innerHTML = 'Enter email or username';
    ok = false;
  } else {
    document.getElementById('login-vir').innerHTML = '';
  }
  if (!pw.trim()) {
    document.getElementById('login-pvir').innerHTML = 'Enter password';
    ok = false;
  } else {
    document.getElementById('login-pvir').innerHTML = '';
  }
  return ok;
}

(function () {
  let currentAvatarUrl = '';
  let currentRole = '';
  let previewObjectUrl = '';

  function setAlert(el, msg, type) {
    if (!el) return;
    el.textContent = msg || '';
    el.className = msg ? `form-alert show ${type === 'success' ? 'success' : 'error'}` : 'form-alert';
    if (msg) {
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        el.className = 'form-alert';
        el.textContent = '';
      }, 4000);
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
  }

  function setAvatar(el, name, avatarUrl) {
    if (!el) return;
    if (window.Dash?.applyAvatar) {
      Dash.applyAvatar(el, name || 'U', avatarUrl);
      return;
    }
    el.style.background = 'linear-gradient(135deg,var(--brand),var(--brand-2))';
    el.style.backgroundImage = avatarUrl ? `url("${avatarUrl}")` : '';
    el.style.backgroundPosition = 'center';
    el.style.backgroundSize = 'cover';
    el.textContent = avatarUrl
      ? ''
      : (window.Dash ? Dash.initials(name || 'U') : (name || 'U').charAt(0)).toUpperCase();
  }

  function fillHeader(name, role, avatarUrl = currentAvatarUrl) {
    const nm = document.getElementById('profileName');
    const rl = document.getElementById('profileRole');
    const av = document.getElementById('profileAvatar');
    if (nm) nm.textContent = name || 'Your Name';
    if (role) currentRole = role;
    if (rl && currentRole) rl.textContent = currentRole;
    setAvatar(av, name, avatarUrl);
  }

  function previewSelectedAvatar() {
    const input = document.getElementById('avatarInput');
    const file = input?.files?.[0];
    const msg = document.getElementById('accountMsg');
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = '';
    }
    if (!file) {
      fillHeader(document.getElementById('displayName')?.value || 'Your Name');
      return;
    }
    if (!file.type.startsWith('image/')) {
      input.value = '';
      Dash.resetFilePicker?.(input);
      setAlert(msg, 'Please choose an image file.', 'error');
      fillHeader(document.getElementById('displayName')?.value || 'Your Name');
      return;
    }
    previewObjectUrl = URL.createObjectURL(file);
    fillHeader(document.getElementById('displayName')?.value || 'Your Name', currentRole, previewObjectUrl);
  }

  async function saveAccount() {
    const name = document.getElementById('displayName').value.trim();
    const email = document.getElementById('emailAddress').value.trim();
    const username = document.getElementById('username').value.trim();
    const avatarInput = document.getElementById('avatarInput');
    const avatarFile = avatarInput?.files?.[0];
    const msg = document.getElementById('accountMsg');

    if (!name) return setAlert(msg, 'Display name cannot be empty.', 'error');
    if (!username) return setAlert(msg, 'Username cannot be empty.', 'error');
    if (!isValidEmail(email)) return setAlert(msg, 'Please enter a valid email address.', 'error');
    if (avatarFile && !avatarFile.type.startsWith('image/')) {
      return setAlert(msg, 'Please choose an image file.', 'error');
    }

    const btn = document.getElementById('saveAccountBtn');
    btn.disabled = true;
    try {
      let avatarUrl = currentAvatarUrl;
      if (avatarFile) {
        const upload = await BuzzMindAPI.uploadFile(avatarFile);
        if (upload.kind && upload.kind !== 'image') {
          throw new Error('Please choose an image file.');
        }
        avatarUrl = upload.url || '';
      }
      const profile = await BuzzMindAPI.updateProfile({ name, email, username, avatarUrl });
      currentAvatarUrl = profile.avatarUrl || avatarUrl || '';
      fillHeader(profile.name || name, profile.role || currentRole, currentAvatarUrl);
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = '';
      }
      if (avatarInput) {
        avatarInput.value = '';
        Dash.resetFilePicker?.(avatarInput);
      }
      setAlert(msg, 'Changes saved successfully!', 'success');
    } catch (err) {
      setAlert(msg, err.message || 'Could not save changes.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function updatePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const msg = document.getElementById('passwordMsg');

    if (!current) return setAlert(msg, 'Please enter your current password.', 'error');
    if (!isStrongPassword(newPass)) {
      return setAlert(
        msg,
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
        'error',
      );
    }
    if (newPass !== confirmPass) return setAlert(msg, 'Passwords do not match.', 'error');

    const btn = document.getElementById('updatePasswordBtn');
    btn.disabled = true;
    try {
      await BuzzMindAPI.updatePassword({ currentPassword: current, newPassword: newPass });
      setAlert(msg, 'Password updated successfully!', 'success');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } catch (err) {
      setAlert(msg, err.message || 'Could not update password.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  document.getElementById('saveAccountBtn').addEventListener('click', saveAccount);
  document.getElementById('updatePasswordBtn').addEventListener('click', updatePassword);
  document.getElementById('avatarInput')?.addEventListener('change', previewSelectedAvatar);

  const boot = Dash.boot('settings');
  (async () => {
    try {
      const me = await boot;
      if (me) {
        currentRole = me.role || '';
        currentAvatarUrl = me.avatarUrl || '';
      }
    } catch (_) {
      /* not logged in */
    }
    try {
      const profile = await BuzzMindAPI.getProfile();
      document.getElementById('displayName').value = profile.name || '';
      document.getElementById('emailAddress').value = profile.email || '';
      document.getElementById('username').value = profile.username || '';
      currentAvatarUrl = profile.avatarUrl || currentAvatarUrl || '';
      fillHeader(profile.name, profile.role || currentRole, currentAvatarUrl);
    } catch (_) {
      fillHeader('Your Name', currentRole, currentAvatarUrl);
    }
  })();
})();

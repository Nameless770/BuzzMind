/* Shared helpers for BuzzMind dashboard pages. Include before page scripts. */
const Dash = {
  /* Inline Lucide-style SVG icons (offline, stroke = currentColor). */
  ICONS: {
    'graduation-cap': '<path d="M21.42 10.92a1 1 0 0 0 0-1.84L12.83 5a2 2 0 0 0-1.66 0L2.58 9.08a1 1 0 0 0 0 1.84L11.17 15a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    'bar-chart': '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    'list-checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    pencil: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.6 8 16l1.4-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>',
    award: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    send: '<path d="M14.54 4.96A1 1 0 0 0 13.1 4l-9.46 4.73a.5.5 0 0 0 .06.92L9 11.5l2-5z" fill="none"/><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  },

  icon(name, cls) {
    const paths = this.ICONS[name] || '';
    return `<svg class="ic-svg${cls ? ` ${cls}` : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  },

  AVATARS: [
    'linear-gradient(135deg,#6d5efc,#9b6bff)',
    'linear-gradient(135deg,#1a2a4a,#2a3a6a)',
    'linear-gradient(135deg,#0f6b53,#29d39b)',
    'linear-gradient(135deg,#6b3a2a,#9b5a3a)',
    'linear-gradient(135deg,#3a2a4a,#5a3a6a)',
    'linear-gradient(135deg,#0b3a5a,#4ea8ff)',
  ],

  escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  initials(name) {
    return String(name || '?')
      .trim()
      .split(/\s+/)
      .filter((p) => /[A-Za-z0-9]/.test(p))
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?';
  },

  avatarColor(seed) {
    const s = String(seed || '');
    let hash = 0;
    for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return this.AVATARS[hash % this.AVATARS.length];
  },

  cssUrl(value) {
    return String(value || '').trim().replace(/\\/g, '').replace(/"/g, '%22');
  },

  avatarStyle(seed, avatarUrl) {
    const url = this.cssUrl(avatarUrl);
    if (url) {
      return `background-image:url("${url}");background-size:cover;background-position:center`;
    }
    return `background:${this.avatarColor(seed)}`;
  },

  avatarHTML(name, seed, avatarUrl, cls = 'avatar') {
    const initials = this.escapeHTML(this.initials(name));
    const color = this.avatarColor(seed || name);
    const url = String(avatarUrl || '').trim();
    // Render initials underneath; overlay the photo so a missing/broken image
    // (onerror removes it) gracefully falls back to the initials.
    const img = url
      ? `<img src="${this.escapeHTML(url)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit" onerror="this.remove()">`
      : '';
    return `<div class="${cls}" style="position:relative;overflow:hidden;background:${color}">${initials}${img}</div>`;
  },

  applyAvatar(el, name, avatarUrl, seed) {
    if (!el) return;
    // Always paint initials + color first, so a missing/broken image still shows something.
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.style.background = this.avatarColor(seed || name);
    el.textContent = this.initials(name);
    el.removeAttribute('aria-label');
    const url = String(avatarUrl || '').trim();
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = `${name || 'User'} avatar`;
      img.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit';
      img.onerror = () => img.remove(); // fall back to the initials underneath
      el.appendChild(img);
      el.setAttribute('aria-label', `${name || 'User'} avatar`);
    }
  },

  fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  fmtDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  timeAgo(d) {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  },

  toast(message, type = 'success') {
    let el = document.getElementById('dash-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dash-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `toast show ${type === 'error' ? 'error' : ''}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.className = 'toast';
    }, 2800);
  },

  openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  },

  closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
  },

  NAV: {
    admin: [
      { key: 'professors', icon: 'graduation-cap', label: 'Professors', href: '/Admin pages/Home page/Admin Home.html' },
      { key: 'users', icon: 'users', label: 'Users', href: '/Admin pages/Users/index.html' },
      { key: 'classes', icon: 'book-open', label: 'Classes', href: '/Admin pages/Classes/index.html' },
      { key: 'quiz', icon: 'list-checks', label: 'Quiz Builder', href: '/Admin pages/QuizBuild/index.html' },
      { key: 'analytics', icon: 'bar-chart', label: 'Analytics', href: '/Admin pages/Analytics/index.html' },
      { key: 'messages', icon: 'mail', label: 'Messages', href: '/Admin pages/Messages/index.html', badge: 'navMsgBadge' },
      { key: 'settings', icon: 'settings', label: 'Settings', href: '/Admin pages/Settings page/SettingsP.html' },
    ],
    professor: [
      { key: 'classes', icon: 'book-open', label: 'Classes', href: '/Prof page/Classes page/professor2.html' },
      { key: 'assignments', icon: 'file-text', label: 'Assignments', href: '/Prof page/Assignments/index.html' },
      { key: 'quiz', icon: 'list-checks', label: 'Quiz Builder', href: '/Prof page/QuizBuild/QuizBuild.html' },
      { key: 'chat', icon: 'message-square', label: 'Messages', href: '/Prof page/Chat/index.html', badge: 'navChatBadge' },
      { key: 'settings', icon: 'settings', label: 'Settings', href: '/Prof page/Settings page/SettingsP.html' },
    ],
  },

  sidebarHTML(role, active, me) {
    const items = this.NAV[role] || this.NAV.admin;
    const av = role === 'professor' ? 'P' : 'A';
    const nav = items.map((it) => `
      <a href="${it.href}" class="${it.key === active ? 'on' : ''}">
        <span class="ic">${this.icon(it.icon)}</span> ${it.label}
        ${it.badge ? `<span class="pill" id="${it.badge}" style="display:none"></span>` : ''}
      </a>`).join('');
    return `
      <div class="dash-brand">BuzzMind</div>
      <div class="dash-usercard">
        ${
          me
            ? this.avatarHTML(me.name, me.id || me.name, me.avatarUrl, 'av')
            : `<div class="av">${av}</div>`
        }
        <div>
          <div class="nm">${me ? this.escapeHTML(me.name) : (role === 'professor' ? 'Professor' : 'Management')}</div>
          <div class="rl">${this.escapeHTML(role)}</div>
        </div>
      </div>
      <nav class="dash-nav">${nav}</nav>
      <div class="spacer"></div>
      <a href="/" class="back-home"><span class="ic">${this.icon('home')}</span> Back to Home</a>
      <a href="/logout" class="signout"><span class="ic">${this.icon('log-out')}</span> Sign Out</a>`;
  },

  mountSidebar(active, me) {
    const host = document.getElementById('dynSidebar');
    if (!host || !me) return;
    host.innerHTML = this.sidebarHTML(me.role, active, me);
  },

  /* Replace any <span data-icon="name"></span> with its inline SVG. */
  hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.getAttribute('data-icon');
      el.innerHTML = this.icon(name);
      el.classList.add('ic');
    });
  },

  fileSummary(input, emptyText) {
    const files = Array.from(input?.files || []);
    if (!files.length) return emptyText || 'No file selected';
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected`;
  },

  syncFilePicker(input) {
    if (!input) return;
    const picker = input.closest('.file-picker');
    if (!picker) return;
    const label = picker.querySelector('[data-file-label]');
    const emptyText = label?.dataset.empty || 'No file selected';
    const hasFiles = Boolean(input.files && input.files.length);
    picker.classList.toggle('is-filled', hasFiles);
    if (label) label.textContent = this.fileSummary(input, emptyText);
  },

  bindFilePickers(root) {
    (root || document).querySelectorAll('.file-picker input[type="file"]').forEach((input) => {
      if (input.dataset.filePickerBound) return;
      input.dataset.filePickerBound = '1';
      input.addEventListener('change', () => this.syncFilePicker(input));
      this.syncFilePicker(input);
    });
  },

  resetFilePicker(inputOrId) {
    const input =
      typeof inputOrId === 'string' ? document.getElementById(inputOrId) : inputOrId;
    if (!input) return;
    input.value = '';
    this.syncFilePicker(input);
  },

  async boot(activeKey) {
    if (typeof BuzzMindAPI === 'undefined') return null;
    try {
      const me = await BuzzMindAPI.getMe();
      window.__me = me;
      if (document.getElementById('dynSidebar')) this.mountSidebar(activeKey, me);
      const nm = document.querySelector('.dash-usercard .nm');
      const rl = document.querySelector('.dash-usercard .rl');
      const av = document.querySelector('.dash-usercard .av');
      if (nm) nm.textContent = me.name || 'User';
      if (rl) rl.textContent = me.role || '';
      this.applyAvatar(av, me.name || 'User', me.avatarUrl, me.id || me.name);
      return me;
    } catch (err) {
      return null;
    }
  },
};

if (typeof window !== 'undefined') window.Dash = Dash;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Dash.hydrateIcons();
    Dash.bindFilePickers();
  });
}

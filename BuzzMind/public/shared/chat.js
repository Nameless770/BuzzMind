/* Shared realtime chat controller for student + professor message pages. */
(function () {
  const E = Dash.escapeHTML;
  let me = null;
  let contacts = [];
  let activeId = null;
  let socket = null;

  const listEl = document.getElementById('contactList');
  const headEl = document.getElementById('chatHead');
  const bodyEl = document.getElementById('chatBody');
  const formEl = document.getElementById('chatForm');
  const textEl = document.getElementById('chatText');

  function totalUnread() {
    return contacts.reduce((sum, c) => sum + (c.unread || 0), 0);
  }

  function updateNavBadge() {
    const badge = document.getElementById('navChatBadge');
    if (!badge) return;
    const n = totalUnread();
    if (n > 0) { badge.textContent = n; badge.style.display = ''; }
    else badge.style.display = 'none';
  }

  function avatarDiv(contact, extraStyle = '') {
    const initials = E(Dash.initials(contact.name || '?'));
    const color = Dash.avatarColor(contact.id || contact.name);
    const url = String(contact.avatarUrl || '').trim();
    // Photo overlays the initials; if it fails to load it removes itself and the
    // initials show through instead of an empty box.
    const img = url
      ? `<img src="${E(url)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit" onerror="this.remove()">`
      : '';
    return `<div class="avatar" style="${extraStyle}position:relative;overflow:hidden;background:${color}">${initials}${img}</div>`;
  }

  function renderContacts() {
    if (!contacts.length) {
      listEl.innerHTML = `<div class="empty" style="padding:24px">No one to message yet.</div>`;
      return;
    }
    listEl.innerHTML = contacts.map((c) => `
      <div class="chat-contact ${c.id === activeId ? 'on' : ''}" data-id="${c.id}">
        ${avatarDiv(c)}
        <div style="min-width:0;flex:1">
          <div class="nm">${E(c.name)}</div>
          <div class="last">${c.lastMessage ? E(c.lastMessage) : '<span style="opacity:.6">No messages yet</span>'}</div>
        </div>
        ${c.unread ? `<span class="un">${c.unread}</span>` : ''}
      </div>`).join('');
    listEl.querySelectorAll('.chat-contact').forEach((el) => {
      el.addEventListener('click', () => openConversation(el.dataset.id));
    });
    updateNavBadge();
  }

  function bubble(m) {
    return `<div class="bubble ${m.mine ? 'mine' : 'them'}">
      ${E(m.text)}<span class="t">${Dash.fmtDateTime(m.createdAt)}</span>
    </div>`;
  }

  function scrollDown() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function ensureProfileModal() {
    if (document.getElementById('chatProfileModal')) return;
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.id = 'chatProfileModal';
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cpName">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
          <div class="avatar" id="cpAvatar" style="width:56px;height:56px;font-size:20px">U</div>
          <div style="min-width:0">
            <h2 id="cpName" style="margin:0 0 4px">—</h2>
            <span class="badge" id="cpRole">—</span>
          </div>
        </div>
        <div class="field"><label>Email</label><div id="cpEmail" style="font-size:14px;word-break:break-all">—</div></div>
        <div class="field"><label>Department</label><div id="cpDept" style="font-size:14px">—</div></div>
        <div class="modal-actions">
          <button class="btn" type="button" id="cpClose">Close</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    back.addEventListener('click', (e) => { if (e.target === back) Dash.closeModal('chatProfileModal'); });
    back.querySelector('#cpClose').addEventListener('click', () => Dash.closeModal('chatProfileModal'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && back.classList.contains('open')) Dash.closeModal('chatProfileModal');
    });
  }

  function openProfile(contact) {
    if (!contact) return;
    ensureProfileModal();
    const av = document.getElementById('cpAvatar');
    Dash.applyAvatar(av, contact.name || '?', contact.avatarUrl, contact.id);
    document.getElementById('cpName').textContent = contact.name || 'Unknown';
    const roleEl = document.getElementById('cpRole');
    const role = contact.role || 'user';
    roleEl.textContent = role;
    roleEl.className = `badge role-${role}`;
    document.getElementById('cpEmail').textContent = contact.email || 'Not available';
    document.getElementById('cpDept').textContent = contact.department || 'Not available';
    Dash.openModal('chatProfileModal');
  }

  function renderHead(contact) {
    if (!contact) { headEl.textContent = 'Conversation'; return; }
    const role = contact.role || '';
    headEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;justify-content:space-between">
        <div id="chatHeadId" role="button" tabindex="0" title="View profile"
             style="display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer">
          ${avatarDiv(contact, 'width:36px;height:36px;')}
          <div style="min-width:0">
            <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${E(contact.name || 'Conversation')}</div>
            ${role ? `<span class="badge role-${E(role)}">${E(role)}</span>` : ''}
          </div>
        </div>
        <button class="btn" type="button" id="chatProfileBtn"><span class="ic" data-icon="user"></span> Profile</button>
      </div>`;
    const open = () => openProfile(contact);
    const idEl = document.getElementById('chatHeadId');
    idEl.addEventListener('click', open);
    idEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    document.getElementById('chatProfileBtn').addEventListener('click', open);
    Dash.hydrateIcons(headEl);
  }

  async function openConversation(id) {
    activeId = id;
    const contact = contacts.find((c) => c.id === id);
    renderHead(contact);
    bodyEl.innerHTML = `<div class="empty" style="margin:auto">Loading…</div>`;
    formEl.style.display = 'flex';
    renderContacts();
    try {
      const data = await BuzzMindAPI.getConversation(id);
      if (contact && data.contact) {
        contact.name = data.contact.name || contact.name;
        contact.role = data.contact.role || contact.role;
        contact.email = data.contact.email || contact.email;
        contact.avatarUrl = data.contact.avatarUrl || contact.avatarUrl;
      }
      renderHead(contact || data.contact);
      bodyEl.innerHTML = data.messages.length
        ? data.messages.map(bubble).join('')
        : `<div class="empty" style="margin:auto">Say hello &#128075;</div>`;
      scrollDown();
      if (contact) { contact.unread = 0; updateNavBadge(); renderContacts(); }
      textEl.focus();
    } catch (err) {
      bodyEl.innerHTML = `<div class="empty" style="margin:auto">${E(err.message || 'Could not load conversation.')}</div>`;
      formEl.style.display = 'none';
    }
  }

  async function send(e) {
    e.preventDefault();
    const text = textEl.value.trim();
    if (!text || !activeId) return;
    textEl.value = '';
    try {
      const msg = await BuzzMindAPI.sendChat(activeId, text);
      if (bodyEl.querySelector('.empty')) bodyEl.innerHTML = '';
      bodyEl.insertAdjacentHTML('beforeend', bubble(msg));
      scrollDown();
      const contact = contacts.find((c) => c.id === activeId);
      if (contact) { contact.lastMessage = text; contact.lastAt = msg.createdAt; }
      moveToTop(activeId);
      renderContacts();
    } catch (err) {
      Dash.toast(err.message || 'Could not send message', 'error');
      textEl.value = text;
    }
  }

  function moveToTop(id) {
    const idx = contacts.findIndex((c) => c.id === id);
    if (idx > 0) contacts.unshift(contacts.splice(idx, 1)[0]);
  }

  function onIncoming(payload) {
    const fromId = String(payload.from);
    let contact = contacts.find((c) => c.id === fromId || String(c.id) === fromId);
    if (fromId === String(activeId)) {
      if (bodyEl.querySelector('.empty')) bodyEl.innerHTML = '';
      bodyEl.insertAdjacentHTML('beforeend', bubble({ text: payload.text, mine: false, createdAt: payload.createdAt }));
      scrollDown();
      if (contact) contact.lastMessage = payload.text;
      moveToTop(fromId);
      renderContacts();
    } else if (contact) {
      contact.unread = (contact.unread || 0) + 1;
      contact.lastMessage = payload.text;
      contact.lastAt = payload.createdAt;
      moveToTop(fromId);
      renderContacts();
    } else {
      loadContacts();
    }
    Dash.toast(`${payload.fromName || 'New message'}: ${payload.text.slice(0, 40)}`);
  }

  async function loadContacts() {
    try {
      contacts = await BuzzMindAPI.getChatContacts();
      renderContacts();
    } catch (err) {
      listEl.innerHTML = `<div class="empty" style="padding:24px">${E(err.message || 'Failed to load contacts.')}</div>`;
    }
  }

  function connectSocket() {
    if (typeof io === 'undefined' || !me) return;
    socket = io();
    socket.on('connect', () => socket.emit('user:join', me.id));
    socket.on('chat:message', onIncoming);
  }

  formEl.addEventListener('submit', send);

  Dash.boot('chat').then(async (user) => {
    me = user;
    if (!me) {
      listEl.innerHTML = `<div class="empty" style="padding:24px">Please sign in.</div>`;
      return;
    }
    connectSocket();
    await loadContacts();
    const to = new URLSearchParams(location.search).get('to');
    if (to) openConversation(to);
  });
})();

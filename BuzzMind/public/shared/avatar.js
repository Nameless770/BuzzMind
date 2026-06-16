/* Tiny self-contained avatar helper for the quiz/lobby/leaderboard pages.
   Renders a user's uploaded photo, or a colored circle with their initials.
   No dependency on dashboard.js so it can be dropped onto any page. */
(function () {
  const COLORS = [
    'linear-gradient(135deg,#6d5efc,#9b6bff)',
    'linear-gradient(135deg,#1a2a4a,#2a3a6a)',
    'linear-gradient(135deg,#0f6b53,#29d39b)',
    'linear-gradient(135deg,#6b3a2a,#9b5a3a)',
    'linear-gradient(135deg,#3a2a4a,#5a3a6a)',
    'linear-gradient(135deg,#0b3a5a,#4ea8ff)',
  ];

  function initials(name) {
    return (
      String(name || '?')
        .trim()
        .split(/\s+/)
        .filter((p) => /[A-Za-z0-9]/.test(p))
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase() || '?'
    );
  }

  function color(seed) {
    const s = String(seed || '');
    let hash = 0;
    for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return COLORS[hash % COLORS.length];
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Make an uploaded path (e.g. "/uploads/x.png") absolute and strip quote chars.
  function resolveUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('//')) return window.location.protocol + trimmed;
    if (trimmed.startsWith('/')) return window.location.origin + trimmed;
    return window.location.origin + '/' + trimmed.replace(/^\/+/, '');
  }

  function cssUrl(url) {
    return resolveUrl(url).replace(/\\/g, '').replace(/'/g, '%27').replace(/"/g, '%22');
  }

  // Returns an avatar element as an HTML string (inline-styled, no CSS needed).
  // Initials render underneath; the photo overlays them and removes itself on
  // error, so a missing/broken image falls back to initials instead of a blank.
  function html(name, seed, url, size = 40) {
    const dim = `width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;`;
    const base = `${dim}position:relative;overflow:hidden;background:${color(
      seed || name,
    )};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${Math.round(
      size * 0.4,
    )}px`;
    const u = String(url || '').trim();
    const img = u
      ? `<img src="${escapeHTML(resolveUrl(u))}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.remove()">`
      : '';
    return `<div class="bz-avatar" style="${base}">${escapeHTML(initials(name))}${img}</div>`;
  }

  // Paints an existing element as an avatar (used for the navbar circle).
  function apply(el, name, url, seed, size) {
    if (!el) return;
    if (size) {
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    }
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#fff';
    el.style.fontWeight = '700';
    el.style.background = color(seed || name);
    el.textContent = initials(name);
    const u = String(url || '').trim();
    if (u) {
      const img = document.createElement('img');
      img.src = resolveUrl(u);
      img.alt = '';
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
      img.onerror = () => img.remove();
      el.appendChild(img);
    }
  }

  window.BuzzAvatar = { initials, color, html, apply, resolveUrl };
})();

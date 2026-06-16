/**
 * Keeps the browser aligned with the server session on protected pages.
 * Include after buzzmind-api.js on student / professor / admin pages.
 */
(function () {
  const PUBLIC_PREFIXES = [
    '/login',
    '/Home Page/',
    '/Quiz/student-quiz',
    '/Quiz/leaderboard.html',
    '/Student pages/Joined Students/',
  ];

  function isPublicPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/home') return true;
    return PUBLIC_PREFIXES.some((prefix) => path.includes(prefix));
  }

  async function guardSession() {
    if (isPublicPage() || typeof BuzzMindAPI === 'undefined') return;

    try {
      const me = await BuzzMindAPI.getMe();
      if (me?.role) {
        sessionStorage.setItem('buzzmindRole', me.role);
      }
    } catch (err) {
      const path = window.location.pathname;
      const onLogin = path.includes('/login');
      if (!onLogin) {
        const next = encodeURIComponent(path + window.location.search);
        window.location.href = `/login?next=${next}`;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', guardSession);
  } else {
    guardSession();
  }
})();

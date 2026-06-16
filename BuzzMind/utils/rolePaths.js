const ROLE_HOME = {
  student: '/Student pages/Home Page/Index.html',
  professor: '/Prof page/Classes page/professor2.html',
  admin: '/Admin pages/Home page/Admin Home.html',
};

function roleHome(role) {
  return ROLE_HOME[role] || '/login';
}

function safeNextUrl(next) {
  if (!next || typeof next !== 'string') return null;
  const decoded = decodeURIComponent(next.trim());
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  if (decoded.startsWith('/login') || decoded.startsWith('/logout')) return null;
  return decoded;
}

module.exports = { ROLE_HOME, roleHome, safeNextUrl };

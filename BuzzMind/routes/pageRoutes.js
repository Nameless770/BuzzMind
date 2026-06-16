const express = require('express');

const authController = require('../controllers/authController');
const pageController = require('../controllers/pageController');
const { requirePageAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { roleHome } = require('../utils/rolePaths');

const router = express.Router();

function registerPageRoute(routePath, ...handlers) {
  router.get(routePath, ...handlers);
  const encodedPath = encodeURI(routePath);
  if (encodedPath !== routePath) {
    router.get(encodedPath, ...handlers);
  }
}

// Locals for public marketing pages (About, Privacy, Pricing, Contact):
// exposes the logged-in user, their dashboard link, and the active nav item.
function marketingLocals(active) {
  return (req) => {
    const user = req.user || null;
    const dashHref = user ? (user.Role ? roleHome(user.Role) : '/role') : '/login';
    return { user, dashHref, active };
  };
}

registerPageRoute('/', pageController.redirect('/Home Page/Home Page.html'));
registerPageRoute(
  '/index.html',
  pageController.redirect('/Home Page/Home Page.html'),
);
registerPageRoute(
  '/home',
  pageController.redirect('/Home Page/Home Page.html'),
);
registerPageRoute(
  '/login',
  redirectIfAuthenticated,
  pageController.render('Login/index', (req) => ({
    error: req.query.error,
    role: req.query.role,
    next: req.query.next || '',
  })),
);
registerPageRoute(
  '/forgot-password',
  pageController.render('Login/forgot-password'),
);
registerPageRoute(
  '/forgot-password.html',
  pageController.render('Login/forgot-password'),
);
registerPageRoute('/Login Page/forgot-password.html', (req, res) => {
  res.redirect('/forgot-password');
});
registerPageRoute('/register', (req, res) => {
  const qs = Object.keys(req.query).length
    ? `?${new URLSearchParams(req.query).toString()}`
    : '';
  res.redirect(`/login${qs}`);
});
registerPageRoute(
  '/Home Page/Home Page.html',
  pageController.render('Home Page/Home Page', (req) => {
    const user = req.user || null;
    const dashHref = user ? (user.Role ? roleHome(user.Role) : '/role') : '/login';
    return { user, dashHref };
  }),
);
registerPageRoute('/Login Page/Login Page.html', (req, res) => {
  const qs = Object.keys(req.query).length
    ? `?${new URLSearchParams(req.query).toString()}`
    : '';
  res.redirect(`/login${qs}`);
});

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/logout', authController.logoutPage);
router.post('/logout', authController.logoutPage);

registerPageRoute(
  '/role',
  requirePageAuth(),
  pageController.render('RolePage/RolePage', (req) => ({
    error: req.query.error,
  })),
);
router.post('/set-role', authController.setRole);

registerPageRoute(
  '/student',
  requirePageAuth('student'),
  pageController.redirect('/Student pages/Home Page/Index.html'),
);
registerPageRoute(
  '/Student pages/Home Page/Index.html',
  requirePageAuth('student'),
  pageController.render('Student pages/Home Page/Index'),
);
registerPageRoute(
  '/Student pages/Joined Students/Joined Students.html',
  pageController.render('Student pages/Joined Students/Joined Students'),
);
registerPageRoute(
  '/Student pages/Libary/index.html',
  requirePageAuth('student'),
  pageController.render('Student pages/Libary/index'),
);
registerPageRoute(
  '/Student pages/reports_design/reports_page.html',
  requirePageAuth('student'),
  pageController.render('Student pages/reports_design/reports_page'),
);
registerPageRoute(
  '/Student pages/Settings page/Settings.html',
  requirePageAuth('student'),
  pageController.render('Student pages/Settings page/Settings'),
);
registerPageRoute(
  '/Student pages/Settings page/index.html',
  requirePageAuth('student'),
  pageController.redirect('/Student pages/Home Page/Index.html'),
);

registerPageRoute(
  '/professor',
  requirePageAuth('professor'),
  pageController.redirect('/Prof page/Classes page/professor2.html'),
);
registerPageRoute(
  '/Prof page/Classes page/professor2.html',
  requirePageAuth('professor'),
  pageController.render('Prof page/Classes page/professor2'),
);
registerPageRoute(
  '/Prof page/classes_design/classes_page.html',
  requirePageAuth('professor'),
  pageController.render('Prof page/classes_design/classes_page'),
);
registerPageRoute(
  '/Prof page/QuizBuild/QuizBuild.html',
  requirePageAuth('professor'),
  pageController.render('Prof page/QuizBuild/QuizBuild'),
);
registerPageRoute(
  '/Prof page/Settings page/SettingsP.html',
  requirePageAuth('professor'),
  pageController.render('Prof page/Settings page/SettingsP'),
);
registerPageRoute(
  '/Prof page/Settings page/index.html',
  requirePageAuth('professor'),
  pageController.redirect('/Prof page/Classes page/professor2.html'),
);

registerPageRoute(
  '/admin',
  requirePageAuth('admin'),
  pageController.redirect('/Admin pages/Home page/Admin Home.html'),
);
registerPageRoute(
  '/Admin pages/Home page/Admin Home.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Home page/Admin Home'),
);
registerPageRoute(
  '/Admin pages/Settings page/SettingsP.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Settings page/SettingsP'),
);
registerPageRoute(
  '/Admin pages/Settings page/index.html',
  requirePageAuth('admin'),
  pageController.redirect('/Admin pages/Home page/Admin Home.html'),
);

// ---- New admin dashboards ----
registerPageRoute(
  '/Admin pages/Users/index.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Users/index'),
);
registerPageRoute(
  '/Admin pages/Classes/index.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Classes/index'),
);
registerPageRoute(
  '/Admin pages/Analytics/index.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Analytics/index'),
);
registerPageRoute(
  '/Admin pages/Messages/index.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Messages/index'),
);
registerPageRoute(
  '/Admin pages/QuizBuild/index.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/QuizBuild/index'),
);
registerPageRoute(
  '/Admin pages/Overview/student.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Overview/student'),
);
registerPageRoute(
  '/Admin pages/Overview/professor.html',
  requirePageAuth('admin'),
  pageController.render('Admin pages/Overview/professor'),
);

// ---- New professor pages ----
registerPageRoute(
  '/Prof page/Assignments/index.html',
  requirePageAuth('professor'),
  pageController.render('Prof page/Assignments/index'),
);
registerPageRoute(
  '/Prof page/Chat/index.html',
  requirePageAuth('professor'),
  pageController.render('Prof page/Chat/index'),
);
registerPageRoute(
  '/Prof page/Overview/student.html',
  requirePageAuth('professor'),
  pageController.render('Admin pages/Overview/student'),
);

// ---- New student pages ----
registerPageRoute(
  '/Student pages/Assignments/index.html',
  requirePageAuth('student'),
  pageController.render('Student pages/Assignments/index'),
);
registerPageRoute(
  '/Student pages/Chat/index.html',
  requirePageAuth('student'),
  pageController.render('Student pages/Chat/index'),
);

// ---- Public marketing pages ----
registerPageRoute('/about', pageController.render('About/index', marketingLocals('about')));
registerPageRoute('/About/index.html', pageController.render('About/index', marketingLocals('about')));
registerPageRoute('/privacy', pageController.render('Privacy/index', marketingLocals('privacy')));
registerPageRoute('/Privacy/index.html', pageController.render('Privacy/index', marketingLocals('privacy')));
registerPageRoute('/pricing', pageController.render('Pricing/index', marketingLocals('pricing')));
registerPageRoute('/Pricing/index.html', pageController.render('Pricing/index', marketingLocals('pricing')));
registerPageRoute('/contact', pageController.render('Contact/index', marketingLocals('contact')));
registerPageRoute('/Contact/index.html', pageController.render('Contact/index', marketingLocals('contact')));

registerPageRoute(
  '/Quiz/student-quiz.html',
  pageController.render('Quiz/student-quiz'),
);
registerPageRoute(
  '/Quiz/leaderboard.html',
  pageController.render('Quiz/leaderboard'),
);
registerPageRoute(
  '/Quiz/professor-quiz.html',
  requirePageAuth('professor', 'admin'),
  pageController.render('Quiz/professor-quiz'),
);
registerPageRoute(
  '/Quiz/leaderboard2.html',
  requirePageAuth('professor', 'admin'),
  pageController.render('Quiz/leaderboard2'),
);

module.exports = router;

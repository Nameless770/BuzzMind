document.addEventListener('DOMContentLoaded', function () {
  initializeSmoothScroll();
  initializeButtonAnimations();
  initializeScrollAnimations();
});

function initializeSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

function initializeButtonAnimations() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach((button) => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-2px)';
    });
    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
    });
  });
}

function initializeScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  const cards = document.querySelectorAll('.feature-card');
  cards.forEach((card) => observer.observe(card));
}

console.log(
  '%cWelcome to BuzzMind!',
  'color: #7c3aed; font-size: 24px; font-weight: bold;',
);
console.log(
  "%cLet's level up your learning!",
  'color: #5b21b6; font-size: 16px;',
);

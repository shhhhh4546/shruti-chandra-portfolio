/* ============================================================
   Mobile navigation toggle
   ============================================================ */
const navToggle = document.querySelector('.nav-toggle');
const navList   = document.querySelector('.nav-list');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navList.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navList.classList.contains('open')) {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });
}

/* ============================================================
   Active nav link on scroll
   ============================================================ */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-list a[href^="#"]');

if ('IntersectionObserver' in window && navLinks.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { rootMargin: '-25% 0px -65% 0px' });

  sections.forEach(s => io.observe(s));
}

/* =========================================================
   Shared header/nav behaviour — included on every page
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const isValidSession = await Auth.validateSession();

  // Reflect admin/guest state
  if (isValidSession) {
    document.body.classList.add('is-admin');
    const admin = Auth.getAdmin();
    const nameEl = document.getElementById('admin-name-slot');
    if (nameEl && admin) nameEl.textContent = admin.name || admin.username;
  } else {
    document.body.classList.remove('is-admin');
  }

  // Highlight the active nav link based on current page
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a[data-page]').forEach((a) => {
    if (a.dataset.page === current) a.classList.add('active');
  });

  // Mobile nav toggle
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

    document.addEventListener('click', (event) => {
      const clickedInsideNav = nav.contains(event.target);
      const clickedToggle = toggle.contains(event.target);
      if (!clickedInsideNav && !clickedToggle && nav.classList.contains('open')) {
        nav.classList.remove('open');
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 800) nav.classList.remove('open');
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      Auth.clearSession();
      toast('You have been logged out.', 'info');
      setTimeout(() => (window.location.replace('index.html')), 600);
    });
  }

  // Reveal-on-scroll for cards
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }
});

/* Guard for admin-only pages: redirect to login if not authenticated */
function requireAdmin() {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

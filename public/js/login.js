document.addEventListener('DOMContentLoaded', async () => {
  if (await Auth.validateSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('l-username').value.trim();
    const password = document.getElementById('l-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    if (!username || !password) {
      errorEl.textContent = 'Please enter both username and password.';
      errorEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('login-submit-btn');
    btn.disabled = true; btn.textContent = 'Logging in...';

    try {
      const data = await apiFetch('/auth/login', { method: 'POST', body: { username, password } });
      Auth.setSession(data.token, data.admin);
      toast(`Welcome back, ${data.admin.name || data.admin.username}!`, 'success');
      setTimeout(() => (window.location.href = 'dashboard.html'), 500);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'Login';
    }
  });
});

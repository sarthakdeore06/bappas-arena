/* =========================================================
   Bappa's Arena — Shared frontend utilities
   API calls, auth/session, toasts, modals, helpers
   ========================================================= */

const API_BASE = '/api';

/* ---------------- Auth/session ---------------- */
const Auth = {
  getToken() {
    const token = localStorage.getItem('bappa_token');
    return token && token.trim() ? token : null;
  },
  getAdmin() {
    try {
      const raw = localStorage.getItem('bappa_admin');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setSession(token, admin) {
    localStorage.setItem('bappa_token', token);
    localStorage.setItem('bappa_admin', JSON.stringify(admin));
  },
  clearSession() {
    localStorage.removeItem('bappa_token');
    localStorage.removeItem('bappa_admin');
  },
  isLoggedIn() { return !!this.getToken(); },
  async validateSession() {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return false;
    }

    try {
      const data = await apiFetch('/auth/me');
      if (!data || !data.admin) {
        throw new Error('Invalid session response');
      }
      this.setSession(token, data.admin);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  },
};

/* ---------------- Core fetch wrapper ---------------- */
async function apiFetch(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    if (res.status === 401) {
      // session expired mid-way — clear it so nav reflects logged-out state
      Auth.clearSession();
    }
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

/* ---------------- Toasts ---------------- */
function toast(message, type = 'info', duration = 3800) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '⚠️', info: '🪔' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ---------------- Confirm modal (replaces window.confirm) ---------------- */
function confirmDialog({ title = 'Are you sure?', message = '', confirmText = 'Delete', danger = true } = {}) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('confirm-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'confirm-overlay';
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-head">
          <h3>${title}</h3>
          <button class="modal-close" id="confirm-close">&times;</button>
        </div>
        <p style="color:var(--text-muted)">${message}</p>
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
          <button class="btn btn-outline" id="confirm-cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = (result) => { overlay.remove(); resolve(result); };
    overlay.querySelector('#confirm-close').onclick = () => close(false);
    overlay.querySelector('#confirm-cancel').onclick = () => close(false);
    overlay.querySelector('#confirm-ok').onclick = () => close(true);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
}

/* ---------------- Small helpers ---------------- */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function debounce(fn, delay = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function emptyStateHTML(icon, title, subtitle) {
  return `
    <div class="empty-state">
      <span class="empty-icon">${icon}</span>
      <h3 style="color:var(--cream-100); font-size:1.05rem;">${title}</h3>
      <p style="max-width:340px; margin:6px auto 0;">${subtitle}</p>
    </div>`;
}

function loaderHTML() {
  return `<div class="loader-wrap"><div class="spinner"></div></div>`;
}

function badgeForCategory(cat) {
  const map = { Children: 'badge-children', Teenagers: 'badge-teenagers', Adults: 'badge-adults' };
  return `<span class="badge ${map[cat] || ''}">${cat}</span>`;
}

const categoryAgeRanges = {
  Children: { min: 0, max: 12, label: '0-12 years' },
  Teenagers: { min: 13, max: 17, label: '13-17 years' },
  Adults: { min: 18, max: 120, label: '18 years and above' },
};

function badgeForStatus(status) {
  const map = { Upcoming: 'badge-upcoming', Ongoing: 'badge-ongoing', Completed: 'badge-completed' };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function badgeForPosition(pos) {
  const map = { Gold: '🥇 Gold', Silver: '🥈 Silver', Bronze: '🥉 Bronze', Participant: 'Participant' };
  const cls = { Gold: 'badge-gold', Silver: 'badge-silver', Bronze: 'badge-bronze', Participant: 'badge-participant' };
  return `<span class="badge ${cls[pos] || ''}">${map[pos] || pos}</span>`;
}

/* ---------------- CSV export ---------------- */
function exportToCSV(filename, rows, columns) {
  if (!rows || !rows.length) { toast('Nothing to export yet.', 'error'); return; }
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows
    .map((row) => columns.map((c) => `"${(c.value(row) ?? '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('CSV exported successfully.', 'success');
}

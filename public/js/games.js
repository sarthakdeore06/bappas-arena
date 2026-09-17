/* Game management page */
let allGames = [];
const currentYearG = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', async () => {
  await populateYearFilterG();
  await loadGames();

  document.getElementById('search-input').addEventListener('input', debounce(loadGames, 300));
  document.getElementById('category-filter').addEventListener('change', loadGames);
  document.getElementById('status-filter').addEventListener('change', loadGames);
  document.getElementById('year-filter').addEventListener('change', loadGames);

  document.getElementById('add-game-btn').addEventListener('click', () => {
    if (!requireAdmin()) return;
    openGameModal();
  });
  document.getElementById('game-modal-close').addEventListener('click', () => document.getElementById('game-modal').classList.remove('open'));
  document.getElementById('game-form').addEventListener('submit', submitGameForm);
});

async function populateYearFilterG() {
  const yearFilter = document.getElementById('year-filter');
  const gYearInput = document.getElementById('g-year');
  try {
    const settings = await apiFetch('/settings');
    const years = await apiFetch('/dashboard/years');
    const set = new Set(years);
    if (settings) set.add(settings.currentYear);
    set.add(currentYearG);
    const sorted = Array.from(set).sort((a, b) => b - a);
    yearFilter.innerHTML = `<option value="">All Years</option>` + sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
    if (settings) { yearFilter.value = settings.currentYear; gYearInput.value = settings.currentYear; }
    else gYearInput.value = currentYearG;
  } catch {
    gYearInput.value = currentYearG;
  }
}

async function loadGames() {
  const wrap = document.getElementById('games-table-wrap');
  wrap.innerHTML = loaderHTML();

  const search = document.getElementById('search-input').value.trim();
  const category = document.getElementById('category-filter').value;
  const status = document.getElementById('status-filter').value;
  const year = document.getElementById('year-filter').value;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (status) params.set('status', status);
  if (year) params.set('year', year);

  try {
    allGames = await apiFetch(`/games?${params.toString()}`);
    renderGames(allGames);
  } catch (err) {
    wrap.innerHTML = emptyStateHTML('⚠️', 'Could not load games', err.message);
  }
}

function renderGames(list) {
  const wrap = document.getElementById('games-table-wrap');
  if (!list.length) {
    wrap.innerHTML = emptyStateHTML('🎮', 'No games scheduled yet', 'Add your first game using the button above.');
    return;
  }
  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Game</th><th>Category</th><th>Date &amp; Time</th><th>Venue</th><th>Status</th><th class="admin-only">Actions</th></tr></thead>
        <tbody>
          ${list.map((g) => `
            <tr>
              <td style="font-weight:600;">${g.name}</td>
              <td>${badgeForCategory(g.category)}</td>
              <td>${formatDate(g.date)} · ${g.time}</td>
              <td>${g.venue}</td>
              <td>${badgeForStatus(g.status)}</td>
              <td class="admin-only">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline edit-btn" data-id="${g._id}">Edit</button>
                  <button class="btn btn-sm btn-danger delete-btn" data-id="${g._id}">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  wrap.querySelectorAll('.edit-btn').forEach((el) => el.addEventListener('click', () => {
    if (!requireAdmin()) return;
    const g = allGames.find((x) => x._id === el.dataset.id);
    openGameModal(g);
  }));
  wrap.querySelectorAll('.delete-btn').forEach((el) => el.addEventListener('click', () => deleteGame(el.dataset.id)));
}

function openGameModal(g) {
  document.getElementById('game-modal-title').textContent = g ? 'Edit Game' : 'Add Game';
  document.getElementById('game-id').value = g ? g._id : '';
  document.getElementById('g-name').value = g ? g.name : '';
  document.getElementById('g-category').value = g ? g.category : '';
  document.getElementById('g-status').value = g ? g.status : 'Upcoming';
  document.getElementById('g-date').value = g ? new Date(g.date).toISOString().slice(0, 10) : '';
  document.getElementById('g-time').value = g ? g.time : '';
  document.getElementById('g-venue').value = g ? g.venue : '';
  document.getElementById('g-year').value = g ? g.year : (document.getElementById('year-filter').value || currentYearG);
  document.getElementById('g-description').value = g ? (g.description || '') : '';
  document.querySelectorAll('#game-form .form-group').forEach((el) => el.classList.remove('has-error'));
  document.getElementById('game-modal').classList.add('open');
}

async function submitGameForm(e) {
  e.preventDefault();
  const id = document.getElementById('game-id').value;
  const name = document.getElementById('g-name').value.trim();
  const category = document.getElementById('g-category').value;
  const status = document.getElementById('g-status').value;
  const date = document.getElementById('g-date').value;
  const time = document.getElementById('g-time').value;
  const venue = document.getElementById('g-venue').value.trim();
  const year = document.getElementById('g-year').value;
  const description = document.getElementById('g-description').value.trim();

  let valid = true;
  const setErr = (id2, isErr) => document.getElementById(id2).closest('.form-group').classList.toggle('has-error', isErr);
  setErr('g-name', !name); if (!name) valid = false;
  setErr('g-category', !category); if (!category) valid = false;
  setErr('g-date', !date); if (!date) valid = false;
  setErr('g-time', !time); if (!time) valid = false;
  setErr('g-venue', !venue); if (!venue) valid = false;
  if (!valid) { toast('Please fix the highlighted fields.', 'error'); return; }

  const payload = { name, category, status, date, time, venue, year: Number(year), description };
  const btn = document.getElementById('game-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await apiFetch(`/games/${id}`, { method: 'PUT', body: payload });
      toast('Game updated successfully.', 'success');
    } else {
      await apiFetch('/games', { method: 'POST', body: payload });
      toast('Game added successfully.', 'success');
    }
    document.getElementById('game-modal').classList.remove('open');
    loadGames();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Game';
  }
}

async function deleteGame(id) {
  if (!requireAdmin()) return;
  const g = allGames.find((x) => x._id === id);
  const ok = await confirmDialog({
    title: 'Delete Game?',
    message: `This will permanently remove "${g ? g.name : 'this game'}" along with all its recorded results.`,
    confirmText: 'Delete',
  });
  if (!ok) return;
  try {
    await apiFetch(`/games/${id}`, { method: 'DELETE' });
    toast('Game deleted.', 'success');
    loadGames();
  } catch (err) {
    toast(err.message, 'error');
  }
}

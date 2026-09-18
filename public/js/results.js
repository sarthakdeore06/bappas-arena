/* Results management page */
let allGamesR = [];
let currentGameResults = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadGamesForSelect();
  await loadResultsForGame('all');

  document.getElementById('game-select').addEventListener('change', (e) => {
    loadResultsForGame(e.target.value);
  });
  document.getElementById('add-result-btn').addEventListener('click', () => {
    if (!requireAdmin()) return;
    openResultModal();
  });
  document.getElementById('result-modal-close').addEventListener('click', () => document.getElementById('result-modal').classList.remove('open'));
  document.getElementById('result-form').addEventListener('submit', submitResultForm);
  document.getElementById('print-btn').addEventListener('click', () => window.print());
});

async function loadGamesForSelect() {
  try {
    allGamesR = await apiFetch('/games');
    const options = allGamesR.map((g) => `<option value="${g._id}">${g.name} (${g.category}, ${formatDate(g.date)})</option>`).join('');
    document.getElementById('game-select').innerHTML = `<option value="all">All Games</option>${options}`;
    document.getElementById('r-game').innerHTML = `<option value="">Select game</option>${options}`;
  } catch (err) {
    toast('Could not load games: ' + err.message, 'error');
  }
}

async function loadResultsForGame(gameId) {
  const tableWrap = document.getElementById('results-table-wrap');

  if (!gameId) {
    tableWrap.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎯</span>
        <h3 style="color:var(--cream-100); font-size:1.05rem;">Select a game above</h3>
        <p>Choose a game from the dropdown to view or add its results.</p>
      </div>`;
    return;
  }

  tableWrap.innerHTML = loaderHTML();
  try {
    const results = await apiFetch(gameId === 'all' ? '/results' : `/results/game/${gameId}`);
    currentGameResults = results.filter((result) => typeof result.winnerName === 'string' && result.winnerName.trim());
    renderResultsTable(currentGameResults, gameId === 'all');
  } catch (err) {
    tableWrap.innerHTML = emptyStateHTML('⚠️', 'Could not load results', err.message);
  }
}

function renderResultsTable(results, isAllGames = false) {
  const tableWrap = document.getElementById('results-table-wrap');
  if (!results.length) {
    tableWrap.innerHTML = emptyStateHTML('📝', isAllGames ? 'No results recorded yet' : 'No results yet for this game', 'Add the first result using the button above.');
    return;
  }

  if (isAllGames) {
    renderOverallResultsTable(results);
    return;
  }

  tableWrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Age Group</th><th>Winner</th><th>Medal</th><th>Remarks</th><th class="admin-only no-print">Actions</th></tr></thead>
        <tbody>
          ${results.map((r) => `
            <tr>
              <td>${r.ageGroup}</td>
              <td>${r.winnerName}</td>
              <td>${badgeForPosition(r.position)}</td>
              <td>${r.remarks || '—'}</td>
              <td class="admin-only no-print">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline edit-result-btn" data-id="${r._id}">Edit</button>
                  <button class="btn btn-sm btn-danger delete-result-btn" data-id="${r._id}">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  tableWrap.querySelectorAll('.edit-result-btn').forEach((el) => el.addEventListener('click', () => {
    if (!requireAdmin()) return;
    const r = currentGameResults.find((x) => x._id === el.dataset.id);
    openResultModal(r);
  }));
  tableWrap.querySelectorAll('.delete-result-btn').forEach((el) => el.addEventListener('click', () => deleteResult(el.dataset.id)));
}

function renderOverallResultsTable(results) {
  const pointsByPosition = { Gold: 5, Silver: 3, Bronze: 1 };
  const players = new Map();

  results.forEach((result) => {
    const key = result.winnerName.trim().toLowerCase();
    const player = players.get(key) || { name: result.winnerName.trim(), gold: 0, silver: 0, bronze: 0, points: 0 };
    const medal = result.position.toLowerCase();
    player[medal] += 1;
    player.points += pointsByPosition[result.position] || 0;
    players.set(key, player);
  });

  const totals = Array.from(players.values()).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  document.getElementById('results-table-wrap').innerHTML = `
    <div class="section-desc" style="margin-bottom:14px;">🥇 Gold = 5 points &nbsp; 🥈 Silver = 3 points &nbsp; 🥉 Bronze = 1 point</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Player</th><th>🥇</th><th>🥈</th><th>🥉</th><th>Points</th></tr></thead>
        <tbody>
          ${totals.map((player, index) => `
            <tr>
              <td>${index + 1}</td>
              <td style="font-weight:600;">${player.name}</td>
              <td>${player.gold}</td>
              <td>${player.silver}</td>
              <td>${player.bronze}</td>
              <td style="color:var(--gold-300); font-weight:700;">${player.points}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openResultModal(r) {
  document.getElementById('result-modal-title').textContent = r ? 'Edit Result' : 'Add Result';
  document.getElementById('result-id').value = r ? r._id : '';
  document.getElementById('r-game').value = r ? r.game._id || r.game : (document.getElementById('game-select').value || '');
  document.getElementById('r-age-group').value = r ? r.ageGroup : '';
  document.getElementById('r-position').value = r ? r.position : '';
  document.getElementById('r-winner-name').value = r ? r.winnerName : '';
  document.getElementById('r-remarks').value = r ? (r.remarks || '') : '';

  // when editing, game shouldn't change
  document.getElementById('r-game').disabled = !!r;

  document.querySelectorAll('#result-form .form-group').forEach((el) => el.classList.remove('has-error'));
  document.getElementById('result-modal').classList.add('open');
}

async function submitResultForm(e) {
  e.preventDefault();
  const id = document.getElementById('result-id').value;
  const game = document.getElementById('r-game').value;
  const ageGroup = document.getElementById('r-age-group').value;
  const position = document.getElementById('r-position').value;
  const winnerName = document.getElementById('r-winner-name').value.trim();
  const remarks = document.getElementById('r-remarks').value.trim();

  let valid = true;
  const setErr = (fid, isErr) => document.getElementById(fid).closest('.form-group').classList.toggle('has-error', isErr);
  setErr('r-game', !game); if (!game) valid = false;
  setErr('r-age-group', !ageGroup); if (!ageGroup) valid = false;
  setErr('r-position', !position); if (!position) valid = false;
  setErr('r-winner-name', !winnerName); if (!winnerName) valid = false;
  if (!valid) { toast('Please fix the highlighted fields.', 'error'); return; }

  const btn = document.getElementById('result-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await apiFetch(`/results/${id}`, { method: 'PUT', body: { ageGroup, position, winnerName, remarks } });
      toast('Result updated successfully.', 'success');
    } else {
      await apiFetch('/results', { method: 'POST', body: { game, ageGroup, position, winnerName, remarks } });
      toast('Result recorded successfully.', 'success');
    }
    document.getElementById('result-modal').classList.remove('open');
    document.getElementById('r-game').disabled = false;
    document.getElementById('game-select').value = game;
    loadResultsForGame(game);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Result';
  }
}

async function deleteResult(id) {
  if (!requireAdmin()) return;
  const ok = await confirmDialog({ title: 'Delete Result?', message: 'This will permanently remove this result entry.', confirmText: 'Delete' });
  if (!ok) return;
  try {
    await apiFetch(`/results/${id}`, { method: 'DELETE' });
    toast('Result deleted.', 'success');
    loadResultsForGame(document.getElementById('game-select').value);
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* Results management page */
let allGamesR = [];
let allParticipantsR = [];
let currentGameResults = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadGamesForSelect();
  await loadParticipantsForSelect();

  document.getElementById('game-select').addEventListener('change', (e) => {
    updateParticipantOptions(e.target.value);
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
    document.getElementById('game-select').innerHTML = `<option value="">Select a game...</option>${options}`;
    document.getElementById('r-game').innerHTML = `<option value="">Select game</option>${options}`;
  } catch (err) {
    toast('Could not load games: ' + err.message, 'error');
  }
}

async function loadParticipantsForSelect() {
  try {
    allParticipantsR = await apiFetch('/participants');
    updateParticipantOptions();
  } catch (err) {
    toast('Could not load participants: ' + err.message, 'error');
  }
}

function updateParticipantOptions(gameId) {
  const game = allGamesR.find((g) => g._id === gameId);
  const eligible = game ? allParticipantsR.filter((p) => p.category === game.category) : [];
  const range = game ? categoryAgeRanges[game.category] : null;
  document.getElementById('r-participant').innerHTML =
    `<option value="">Select participant</option>` +
    eligible.map((p) => `<option value="${p._id}">${p.name} (${p.age})</option>`).join('');
  document.getElementById('result-eligibility-hint').textContent = range
    ? `Eligible participants: ${game.category} (${range.label}).`
    : 'Select a game to show eligible participants.';
}

async function loadResultsForGame(gameId) {
  const podiumWrap = document.getElementById('podium-wrap');
  const tableWrap = document.getElementById('results-table-wrap');

  if (!gameId) {
    podiumWrap.innerHTML = '';
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
    currentGameResults = await apiFetch(`/results/game/${gameId}`);
    renderPodium(currentGameResults);
    renderResultsTable(currentGameResults);
  } catch (err) {
    tableWrap.innerHTML = emptyStateHTML('⚠️', 'Could not load results', err.message);
  }
}

function renderPodium(results) {
  const podiumWrap = document.getElementById('podium-wrap');
  const winners = { Gold: null, Silver: null, Bronze: null };
  results.forEach((r) => { if (Object.prototype.hasOwnProperty.call(winners, r.position)) winners[r.position] = r; });

  if (!winners.Gold && !winners.Silver && !winners.Bronze) {
    podiumWrap.innerHTML = '';
    return;
  }

  const gameName = document.getElementById('game-select').selectedOptions[0]?.text || '';

  podiumWrap.innerHTML = `
    <div class="glass-card" style="padding:26px; text-align:center;">
      <div class="eyebrow">WINNERS</div>
      <h3 style="margin-bottom:0;">${gameName}</h3>
      <div class="podium">
        ${winners.Silver ? podiumItem(winners.Silver, 'silver', '🥈') : ''}
        ${winners.Gold ? podiumItem(winners.Gold, 'gold', '🥇') : ''}
        ${winners.Bronze ? podiumItem(winners.Bronze, 'bronze', '🥉') : ''}
      </div>
    </div>`;
}

function podiumItem(result, cls, emoji) {
  return `
    <div class="podium-item ${cls}">
      <div class="podium-avatar">${emoji}</div>
      <div class="podium-bar">
        <div class="podium-name">${result.participant ? result.participant.name : '—'}</div>
        <div class="podium-score">Score: ${result.score}</div>
      </div>
    </div>`;
}

function renderResultsTable(results) {
  const tableWrap = document.getElementById('results-table-wrap');
  if (!results.length) {
    tableWrap.innerHTML = emptyStateHTML('📝', 'No results yet for this game', 'Add the first result using the button above.');
    return;
  }
  tableWrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Rank</th><th>Participant</th><th>Score</th><th>Position</th><th>Remarks</th><th class="admin-only no-print">Actions</th></tr></thead>
        <tbody>
          ${results.map((r) => `
            <tr>
              <td>#${r.rank}</td>
              <td>${r.participant ? r.participant.name : '—'}</td>
              <td>${r.score}</td>
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

function openResultModal(r) {
  document.getElementById('result-modal-title').textContent = r ? 'Edit Result' : 'Add Result';
  document.getElementById('result-id').value = r ? r._id : '';
  document.getElementById('r-game').value = r ? r.game._id || r.game : (document.getElementById('game-select').value || '');
  updateParticipantOptions(document.getElementById('r-game').value);
  document.getElementById('r-participant').value = r ? (r.participant._id || r.participant) : '';
  document.getElementById('r-score').value = r ? r.score : '';
  document.getElementById('r-rank').value = r ? r.rank : '';
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
  const participant = document.getElementById('r-participant').value;
  const score = document.getElementById('r-score').value;
  const rank = document.getElementById('r-rank').value;
  const remarks = document.getElementById('r-remarks').value.trim();

  let valid = true;
  const setErr = (fid, isErr) => document.getElementById(fid).closest('.form-group').classList.toggle('has-error', isErr);
  setErr('r-game', !game); if (!game) valid = false;
  setErr('r-participant', !participant); if (!participant) valid = false;
  setErr('r-score', score === ''); if (score === '') valid = false;
  setErr('r-rank', !rank || rank < 1); if (!rank || rank < 1) valid = false;
  if (!valid) { toast('Please fix the highlighted fields.', 'error'); return; }

  const btn = document.getElementById('result-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await apiFetch(`/results/${id}`, { method: 'PUT', body: { score: Number(score), rank: Number(rank), remarks } });
      toast('Result updated successfully.', 'success');
    } else {
      await apiFetch('/results', { method: 'POST', body: { game, participant, score: Number(score), rank: Number(rank), remarks } });
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

/* Year-wise festival records page */
let currentRecord = null;
let activeTab = 'participants';

document.addEventListener('DOMContentLoaded', async () => {
  await populateYearsForRecords();
  document.getElementById('year-select').addEventListener('change', (e) => loadRecord(e.target.value));

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderTabContent();
    });
  });
});

async function populateYearsForRecords() {
  const select = document.getElementById('year-select');
  try {
    const years = await apiFetch('/dashboard/years');
    const settings = await apiFetch('/settings');
    const set = new Set(years);
    if (settings) set.add(settings.currentYear);
    const sorted = Array.from(set).sort((a, b) => b - a);
    if (!sorted.length) {
      select.innerHTML = `<option value="">No records yet</option>`;
      document.getElementById('records-content').innerHTML = emptyStateHTML('📜', 'No festival records yet', 'Records will appear here once participants and games are added for a festival year.');
      return;
    }
    select.innerHTML = sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
    select.value = settings ? settings.currentYear : sorted[0];
    await loadRecord(select.value);
  } catch (err) {
    document.getElementById('records-content').innerHTML = emptyStateHTML('⚠️', 'Could not load years', err.message);
  }
}

async function loadRecord(year) {
  if (!year) return;
  document.getElementById('records-content').innerHTML = loaderHTML();
  try {
    currentRecord = await apiFetch(`/records/${year}`);
    document.getElementById('record-stats').innerHTML = `
      <div class="glass-card stat-card"><span class="stat-icon">🧑‍🤝‍🧑</span><div class="stat-value">${currentRecord.totalParticipants}</div><div class="stat-label">Participants</div></div>
      <div class="glass-card stat-card"><span class="stat-icon">🎮</span><div class="stat-value">${currentRecord.totalGames}</div><div class="stat-label">Games</div></div>
      <div class="glass-card stat-card"><span class="stat-icon">🏅</span><div class="stat-value">${currentRecord.totalResults}</div><div class="stat-label">Results Recorded</div></div>`;
    renderTabContent();
  } catch (err) {
    document.getElementById('records-content').innerHTML = emptyStateHTML('⚠️', 'Could not load this year\'s records', err.message);
  }
}

function renderTabContent() {
  const wrap = document.getElementById('records-content');
  if (!currentRecord) return;

  if (activeTab === 'participants') {
    const list = currentRecord.participants;
    wrap.innerHTML = !list.length ? emptyStateHTML('🧑‍🤝‍🧑', 'No participants recorded', 'No participants were registered for this festival year.') : `
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Category</th><th>Contact/Guardian</th></tr></thead>
        <tbody>${list.map((p) => `<tr><td>${p.name}</td><td>${badgeForCategory(p.category)}</td><td>${p.contactName}</td></tr>`).join('')}</tbody>
      </table></div>`;
  } else if (activeTab === 'games') {
    const list = currentRecord.games;
    wrap.innerHTML = !list.length ? emptyStateHTML('🎮', 'No games recorded', 'No games were scheduled for this festival year.') : `
      <div class="table-wrap"><table>
        <thead><tr><th>Game</th><th>Category</th><th>Date</th><th>Venue</th><th>Status</th></tr></thead>
        <tbody>${list.map((g) => `<tr><td>${g.name}</td><td>${badgeForCategory(g.category)}</td><td>${formatDate(g.date)}</td><td>${g.venue}</td><td>${badgeForStatus(g.status)}</td></tr>`).join('')}</tbody>
      </table></div>`;
  } else {
    const list = currentRecord.results;
    wrap.innerHTML = !list.length ? emptyStateHTML('🏅', 'No results recorded', 'No results were entered for this festival year.') : `
      <div class="table-wrap"><table>
        <thead><tr><th>Game</th><th>Participant</th><th>Score</th><th>Rank</th><th>Position</th></tr></thead>
        <tbody>${list.map((r) => `<tr><td>${r.game ? r.game.name : '—'}</td><td>${r.participant ? r.participant.name : '—'}</td><td>${r.score}</td><td>#${r.rank}</td><td>${badgeForPosition(r.position)}</td></tr>`).join('')}</tbody>
      </table></div>`;
  }
}

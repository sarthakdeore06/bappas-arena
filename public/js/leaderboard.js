/* Overall leaderboard page */
let currentLeaderboard = [];

document.addEventListener('DOMContentLoaded', async () => {
  await populateYearFilterL();
  await loadLeaderboard();

  document.getElementById('category-filter').addEventListener('change', loadLeaderboard);
  document.getElementById('year-filter').addEventListener('change', loadLeaderboard);
  document.getElementById('export-csv-btn').addEventListener('click', exportLeaderboardCSV);
});

async function populateYearFilterL() {
  const yearFilter = document.getElementById('year-filter');
  try {
    const settings = await apiFetch('/settings');
    const years = await apiFetch('/dashboard/years');
    const set = new Set(years);
    if (settings) set.add(settings.currentYear);
    const sorted = Array.from(set).sort((a, b) => b - a);
    yearFilter.innerHTML = `<option value="">All Years</option>` + sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
    if (settings) yearFilter.value = settings.currentYear;
  } catch { /* ignore */ }
}

async function loadLeaderboard() {
  const top3Wrap = document.getElementById('top3-wrap');
  const tableWrap = document.getElementById('leaderboard-table-wrap');
  tableWrap.innerHTML = loaderHTML();

  const category = document.getElementById('category-filter').value;
  const year = document.getElementById('year-filter').value;
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (year) params.set('year', year);

  try {
    currentLeaderboard = await apiFetch(`/leaderboard/overall?${params.toString()}`);
    renderTop3(currentLeaderboard);
    renderLeaderboardTable(currentLeaderboard);
  } catch (err) {
    top3Wrap.innerHTML = '';
    tableWrap.innerHTML = emptyStateHTML('⚠️', 'Could not load leaderboard', err.message);
  }
}

function renderTop3(list) {
  const wrap = document.getElementById('top3-wrap');
  if (!list.length) { wrap.innerHTML = ''; return; }
  const [first, second, third] = list;
  wrap.innerHTML = `
    <div class="glass-card" style="padding:26px; text-align:center;">
      <div class="eyebrow">TOP PERFORMERS</div>
      <div class="podium">
        ${second ? topItem(second, 'silver', '🥈') : ''}
        ${first ? topItem(first, 'gold', '🥇') : ''}
        ${third ? topItem(third, 'bronze', '🥉') : ''}
      </div>
    </div>`;
}

function topItem(entry, cls, emoji) {
  return `
    <div class="podium-item ${cls}">
      <div class="podium-avatar">${emoji}</div>
      <div class="podium-bar">
        <div class="podium-name">${entry.name}</div>
        <div class="podium-score">${entry.points} pts</div>
      </div>
    </div>`;
}

function renderLeaderboardTable(list) {
  const wrap = document.getElementById('leaderboard-table-wrap');
  if (!list.length) {
    wrap.innerHTML = emptyStateHTML('🏆', 'No results recorded yet', 'Once games are completed and results are entered, the leaderboard will appear here.');
    return;
  }
  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Participant</th><th>Category</th><th>🥇</th><th>🥈</th><th>🥉</th><th>Games</th><th>Points</th></tr></thead>
        <tbody>
          ${list.map((e, i) => `
            <tr>
              <td>${i + 1}</td>
              <td style="font-weight:600;">${e.name}</td>
              <td>${badgeForCategory(e.category)}</td>
              <td>${e.gold}</td>
              <td>${e.silver}</td>
              <td>${e.bronze}</td>
              <td>${e.totalGames}</td>
              <td style="color:var(--gold-300); font-weight:700;">${e.points}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function exportLeaderboardCSV() {
  exportToCSV('leaderboard.csv', currentLeaderboard, [
    { label: 'Name', value: (r) => r.name },
    { label: 'Category', value: (r) => r.category },
    { label: 'Gold', value: (r) => r.gold },
    { label: 'Silver', value: (r) => r.silver },
    { label: 'Bronze', value: (r) => r.bronze },
    { label: 'Total Games', value: (r) => r.totalGames },
    { label: 'Points', value: (r) => r.points },
  ]);
}

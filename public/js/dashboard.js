document.addEventListener('DOMContentLoaded', async () => {
  const yearSelect = document.getElementById('year-select');
  const statsGrid = document.getElementById('dash-stats');

  async function loadYears(selected) {
    try {
      const years = await apiFetch('/dashboard/years');
      const settings = await apiFetch('/settings');
      const allYears = new Set(years);
      if (settings) allYears.add(settings.currentYear);
      const sorted = Array.from(allYears).sort((a, b) => b - a);
      yearSelect.innerHTML = sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
      yearSelect.value = selected || (settings ? settings.currentYear : sorted[0]);
    } catch {
      yearSelect.innerHTML = `<option>${new Date().getFullYear()}</option>`;
    }
  }

  async function loadStats(year) {
    statsGrid.innerHTML = loaderHTML();
    try {
      const stats = await apiFetch(`/dashboard/stats?year=${year}`);
      statsGrid.innerHTML = `
        <div class="glass-card stat-card reveal in-view">
          <span class="stat-icon">🧑‍🤝‍🧑</span>
          <div class="stat-value">${stats.totalParticipants}</div>
          <div class="stat-label">Total Participants</div>
        </div>
        <div class="glass-card stat-card reveal in-view">
          <span class="stat-icon">🎮</span>
          <div class="stat-value">${stats.totalGames}</div>
          <div class="stat-label">Total Games</div>
        </div>
        <div class="glass-card stat-card reveal in-view">
          <span class="stat-icon">✅</span>
          <div class="stat-value">${stats.completedGames}</div>
          <div class="stat-label">Completed Competitions</div>
        </div>
        <div class="glass-card stat-card reveal in-view">
          <span class="stat-icon">🏆</span>
          <div class="stat-value">${stats.totalWinners}</div>
          <div class="stat-label">Total Winners</div>
        </div>`;
    } catch (err) {
      statsGrid.innerHTML = emptyStateHTML('🪔', 'Could not load stats', err.message);
    }
  }

  await loadYears();
  await loadStats(yearSelect.value);

  yearSelect.addEventListener('change', () => loadStats(yearSelect.value));
});

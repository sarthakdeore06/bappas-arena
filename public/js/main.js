/* Homepage logic */
document.addEventListener('DOMContentLoaded', async () => {
  spawnParticles('hero-particles', 14);

  const statsGrid = document.getElementById('home-stats');
  const yearBadge = document.getElementById('hero-year-badge');

  try {
    const stats = await apiFetch('/dashboard/stats');
    yearBadge.textContent = `🪔 Festival Year — ${stats.currentYear}`;

    statsGrid.innerHTML = `
      <div class="glass-card stat-card reveal">
        <span class="stat-icon">🧑‍🤝‍🧑</span>
        <div class="stat-value">${stats.totalParticipants}</div>
        <div class="stat-label">Total Participants</div>
      </div>
      <div class="glass-card stat-card reveal">
        <span class="stat-icon">🎮</span>
        <div class="stat-value">${stats.totalGames}</div>
        <div class="stat-label">Total Games</div>
      </div>
      <div class="glass-card stat-card reveal">
        <span class="stat-icon">✅</span>
        <div class="stat-value">${stats.completedGames}</div>
        <div class="stat-label">Completed Competitions</div>
      </div>
      <div class="glass-card stat-card reveal">
        <span class="stat-icon">🏆</span>
        <div class="stat-value">${stats.totalWinners}</div>
        <div class="stat-label">Total Winners</div>
      </div>`;
  } catch (err) {
    statsGrid.innerHTML = emptyStateHTML('🪔', 'Stats unavailable', 'Could not load festival stats right now. Please make sure the server and database are running.');
  }
});

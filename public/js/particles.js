/* =========================================================
   Lightweight floating-particle decoration for hero sections
   Pure DOM/CSS — no canvas, no external libraries
   ========================================================= */

function spawnParticles(containerId, count = 16) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const left = Math.random() * 100;
    const duration = 8 + Math.random() * 10;
    const delay = Math.random() * 10;
    const size = 3 + Math.random() * 5;
    p.style.left = `${left}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${delay}s`;
    container.appendChild(p);
  }
}

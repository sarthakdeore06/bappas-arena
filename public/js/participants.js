/* Participant management page */
let allParticipants = [];
const currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', async () => {
  await populateYearFilter();
  await loadParticipants();

  document.getElementById('search-input').addEventListener('input', debounce(loadParticipants, 300));
  document.getElementById('category-filter').addEventListener('change', loadParticipants);
  document.getElementById('year-filter').addEventListener('change', loadParticipants);
  document.getElementById('export-csv-btn').addEventListener('click', exportParticipantsCSV);

  document.getElementById('add-participant-btn').addEventListener('click', () => {
    if (!requireAdmin()) return;
    openParticipantModal();
  });

  document.getElementById('participant-modal-close').addEventListener('click', closeParticipantModal);
  document.getElementById('participant-form').addEventListener('submit', submitParticipantForm);
  document.getElementById('profile-modal-close').addEventListener('click', () => {
    document.getElementById('profile-modal').classList.remove('open');
  });
});

async function populateYearFilter() {
  const yearFilter = document.getElementById('year-filter');
  const pYearInput = document.getElementById('p-year');
  try {
    const settings = await apiFetch('/settings');
    const years = await apiFetch('/dashboard/years');
    const set = new Set(years);
    if (settings) set.add(settings.currentYear);
    set.add(currentYear);
    const sorted = Array.from(set).sort((a, b) => b - a);
    yearFilter.innerHTML = `<option value="">All Years</option>` + sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
    if (settings) { yearFilter.value = settings.currentYear; pYearInput.value = settings.currentYear; }
    else pYearInput.value = currentYear;
  } catch {
    pYearInput.value = currentYear;
  }
}

async function loadParticipants() {
  const wrap = document.getElementById('participants-table-wrap');
  wrap.innerHTML = loaderHTML();

  const search = document.getElementById('search-input').value.trim();
  const category = document.getElementById('category-filter').value;
  const year = document.getElementById('year-filter').value;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (year) params.set('year', year);

  try {
    allParticipants = await apiFetch(`/participants?${params.toString()}`);
    renderParticipants(allParticipants);
  } catch (err) {
    wrap.innerHTML = emptyStateHTML('⚠️', 'Could not load participants', err.message);
  }
}

function renderParticipants(list) {
  const wrap = document.getElementById('participants-table-wrap');
  if (!list.length) {
    wrap.innerHTML = emptyStateHTML('🧑‍🤝‍🧑', 'No participants yet', 'Add your first participant using the button above to get started.');
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Age</th><th>Category</th><th>Contact / Guardian</th><th>Year</th><th class="admin-only">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((p) => `
            <tr>
              <td><a href="#" class="view-profile" data-id="${p._id}" style="color:var(--gold-300); font-weight:600;">${p.name}</a></td>
              <td>${p.age}</td>
              <td>${badgeForCategory(p.category)}</td>
              <td>${p.contactName}${p.contactPhone ? ' · ' + p.contactPhone : ''}</td>
              <td>${p.year}</td>
              <td class="admin-only">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline edit-btn" data-id="${p._id}">Edit</button>
                  <button class="btn btn-sm btn-danger delete-btn" data-id="${p._id}">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  wrap.querySelectorAll('.view-profile').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    openProfile(el.dataset.id);
  }));
  wrap.querySelectorAll('.edit-btn').forEach((el) => el.addEventListener('click', () => {
    if (!requireAdmin()) return;
    const p = allParticipants.find((x) => x._id === el.dataset.id);
    openParticipantModal(p);
  }));
  wrap.querySelectorAll('.delete-btn').forEach((el) => el.addEventListener('click', () => deleteParticipant(el.dataset.id)));
}

function openParticipantModal(p) {
  document.getElementById('participant-modal-title').textContent = p ? 'Edit Participant' : 'Add Participant';
  document.getElementById('participant-id').value = p ? p._id : '';
  document.getElementById('p-name').value = p ? p.name : '';
  document.getElementById('p-age').value = p ? p.age : '';
  document.getElementById('p-category').value = p ? p.category : '';
  document.getElementById('p-contact-name').value = p ? p.contactName : '';
  document.getElementById('p-contact-phone').value = p ? (p.contactPhone || '') : '';
  document.getElementById('p-year').value = p ? p.year : (document.getElementById('year-filter').value || currentYear);
  document.getElementById('p-notes').value = p ? (p.notes || '') : '';
  document.querySelectorAll('#participant-form .form-group').forEach((g) => g.classList.remove('has-error'));
  document.getElementById('participant-modal').classList.add('open');
}

function closeParticipantModal() {
  document.getElementById('participant-modal').classList.remove('open');
}

async function submitParticipantForm(e) {
  e.preventDefault();
  const id = document.getElementById('participant-id').value;
  const name = document.getElementById('p-name').value.trim();
  const age = document.getElementById('p-age').value;
  const category = document.getElementById('p-category').value;
  const contactName = document.getElementById('p-contact-name').value.trim();
  const contactPhone = document.getElementById('p-contact-phone').value.trim();
  const year = document.getElementById('p-year').value;
  const notes = document.getElementById('p-notes').value.trim();

  let valid = true;
  const setErr = (fieldId, isErr) => document.getElementById(fieldId).closest('.form-group').classList.toggle('has-error', isErr);
  setErr('p-name', !name); if (!name) valid = false;
  const ageRange = categoryAgeRanges[category];
  const invalidAge = !age || !ageRange || Number(age) < ageRange.min || Number(age) > ageRange.max;
  setErr('p-age', invalidAge); if (invalidAge) valid = false;
  setErr('p-category', !category); if (!category) valid = false;
  setErr('p-contact-name', !contactName); if (!contactName) valid = false;
  if (!valid) { toast('Please fix the highlighted fields.', 'error'); return; }

  const payload = { name, age: Number(age), category, contactName, contactPhone, year: Number(year), notes };
  const btn = document.getElementById('participant-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await apiFetch(`/participants/${id}`, { method: 'PUT', body: payload });
      toast('Participant updated successfully.', 'success');
    } else {
      await apiFetch('/participants', { method: 'POST', body: payload });
      toast('Participant added successfully.', 'success');
    }
    closeParticipantModal();
    loadParticipants();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Participant';
  }
}

async function deleteParticipant(id) {
  if (!requireAdmin()) return;
  const p = allParticipants.find((x) => x._id === id);
  const ok = await confirmDialog({
    title: 'Delete Participant?',
    message: `This will permanently remove "${p ? p.name : 'this participant'}" and all their results. This cannot be undone.`,
    confirmText: 'Delete',
  });
  if (!ok) return;
  try {
    await apiFetch(`/participants/${id}`, { method: 'DELETE' });
    toast('Participant deleted.', 'success');
    loadParticipants();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function openProfile(id) {
  const modal = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  document.getElementById('profile-name').textContent = 'Loading...';
  content.innerHTML = loaderHTML();
  modal.classList.add('open');

  try {
    const { participant, results } = await apiFetch(`/participants/${id}`);
    document.getElementById('profile-name').textContent = participant.name;

    const medalCount = { Gold: 0, Silver: 0, Bronze: 0 };
    results.forEach((r) => { if (medalCount[r.position] !== undefined) medalCount[r.position]++; });

    content.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        <div class="glass-card info-card"><div class="stat-icon">🎂</div><div class="stat-value" style="font-size:1.4rem;">${participant.age}</div><div class="stat-label">Age</div></div>
        <div class="glass-card info-card">${badgeForCategory(participant.category)}<div class="stat-label" style="margin-top:8px;">Category</div></div>
        <div class="glass-card info-card"><div class="stat-icon">🥇${medalCount.Gold} 🥈${medalCount.Silver} 🥉${medalCount.Bronze}</div><div class="stat-label">Medals Won</div></div>
      </div>
      <p style="color:var(--text-muted); font-size:0.85rem;">Contact / Guardian: ${participant.contactName}${participant.contactPhone ? ' · ' + participant.contactPhone : ''}</p>
      <h4 style="margin-top:20px;">Game History</h4>
      ${results.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Game</th><th>Score</th><th>Rank</th><th>Position</th></tr></thead>
            <tbody>
              ${results.map((r) => `<tr><td>${r.game ? r.game.name : '—'}</td><td>${r.score}</td><td>#${r.rank}</td><td>${badgeForPosition(r.position)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>` : emptyStateHTML('🎮', 'No games played yet', 'This participant has not been entered into any results yet.')}
    `;
  } catch (err) {
    content.innerHTML = emptyStateHTML('⚠️', 'Could not load profile', err.message);
  }
}

function exportParticipantsCSV() {
  exportToCSV('participants.csv', allParticipants, [
    { label: 'Name', value: (r) => r.name },
    { label: 'Age', value: (r) => r.age },
    { label: 'Category', value: (r) => r.category },
    { label: 'Contact/Guardian', value: (r) => r.contactName },
    { label: 'Phone', value: (r) => r.contactPhone || '' },
    { label: 'Year', value: (r) => r.year },
  ]);
}

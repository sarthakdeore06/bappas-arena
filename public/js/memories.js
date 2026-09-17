/* Festival photo gallery page */
const currentYearM = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', async () => {
  await populateYearFilterM();
  await loadGallery();

  document.getElementById('year-filter').addEventListener('change', loadGallery);
  document.getElementById('upload-btn').addEventListener('click', () => {
    if (!requireAdmin()) return;
    document.getElementById('m-year').value = document.getElementById('year-filter').value || currentYearM;
    document.getElementById('upload-modal').classList.add('open');
  });
  document.getElementById('upload-modal-close').addEventListener('click', () => document.getElementById('upload-modal').classList.remove('open'));
  document.getElementById('upload-form').addEventListener('submit', submitUpload);
});

async function populateYearFilterM() {
  const yearFilter = document.getElementById('year-filter');
  try {
    const settings = await apiFetch('/settings');
    const years = await apiFetch('/dashboard/years');
    const set = new Set(years);
    if (settings) set.add(settings.currentYear);
    set.add(currentYearM);
    const sorted = Array.from(set).sort((a, b) => b - a);
    yearFilter.innerHTML = `<option value="">All Years</option>` + sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
  } catch { /* ignore */ }
}

async function loadGallery() {
  const wrap = document.getElementById('gallery-wrap');
  wrap.innerHTML = loaderHTML();
  const year = document.getElementById('year-filter').value;
  const params = new URLSearchParams();
  if (year) params.set('year', year);

  try {
    const memories = await apiFetch(`/memories?${params.toString()}`);
    if (!memories.length) {
      wrap.innerHTML = emptyStateHTML('📸', 'No photos yet', 'Festival photographs uploaded by the organizers will appear here.');
      return;
    }
    wrap.innerHTML = `<div class="gallery-grid">${memories.map((m) => `
      <div class="glass-card gallery-item reveal in-view">
        <img src="${m.imageUrl}" alt="${m.eventName || 'Festival memory'}" loading="lazy">
        <div class="gallery-caption">
          ${m.eventName ? `<span class="event-name">${m.eventName}</span>` : ''}
          <span>${m.caption || ''}</span>
        </div>
        <button class="delete-photo admin-only" data-id="${m._id}" title="Delete photo">&times;</button>
      </div>`).join('')}</div>`;

    wrap.querySelectorAll('.delete-photo').forEach((btn) => btn.addEventListener('click', () => deletePhoto(btn.dataset.id)));
  } catch (err) {
    wrap.innerHTML = emptyStateHTML('⚠️', 'Could not load gallery', err.message);
  }
}

async function submitUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('m-photo');
  const eventName = document.getElementById('m-event').value.trim();
  const caption = document.getElementById('m-caption').value.trim();
  const year = document.getElementById('m-year').value;

  if (!fileInput.files.length) {
    fileInput.closest('.form-group').classList.add('has-error');
    toast('Please choose a photo to upload.', 'error');
    return;
  }
  fileInput.closest('.form-group').classList.remove('has-error');

  const formData = new FormData();
  formData.append('photo', fileInput.files[0]);
  formData.append('eventName', eventName);
  formData.append('caption', caption);
  formData.append('year', year);

  const btn = document.getElementById('upload-submit-btn');
  btn.disabled = true; btn.textContent = 'Uploading...';

  try {
    await apiFetch('/memories', { method: 'POST', body: formData, isForm: true });
    toast('Photo uploaded successfully.', 'success');
    document.getElementById('upload-modal').classList.remove('open');
    document.getElementById('upload-form').reset();
    loadGallery();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Upload Photo';
  }
}

async function deletePhoto(id) {
  if (!requireAdmin()) return;
  const ok = await confirmDialog({ title: 'Delete Photo?', message: 'This photo will be permanently removed from the gallery.', confirmText: 'Delete' });
  if (!ok) return;
  try {
    await apiFetch(`/memories/${id}`, { method: 'DELETE' });
    toast('Photo deleted.', 'success');
    loadGallery();
  } catch (err) {
    toast(err.message, 'error');
  }
}

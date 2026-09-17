/* Budget management page */
let allBudgetItems = [];
const currentYearBudget = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', async () => {
  await populateYearFilterBudget();
  await loadBudgetSummary();
  await loadBudget();

  document.getElementById('budget-search').addEventListener('input', debounce(loadBudget, 300));
  document.getElementById('budget-type-filter').addEventListener('change', loadBudget);
  document.getElementById('budget-year-filter').addEventListener('change', () => {
    loadBudget();
    loadBudgetSummary();
  });

  document.getElementById('add-budget-btn').addEventListener('click', () => {
    if (!requireAdmin()) return;
    openBudgetModal();
  });

  document.getElementById('budget-modal-close').addEventListener('click', () => document.getElementById('budget-modal').classList.remove('open'));
  document.getElementById('budget-form').addEventListener('submit', submitBudgetForm);
});

async function populateYearFilterBudget() {
  const yearFilter = document.getElementById('budget-year-filter');
  const bYearInput = document.getElementById('b-year');

  try {
    const settings = await apiFetch('/settings');
    const years = await apiFetch('/dashboard/years');
    const set = new Set(years);
    if (settings) set.add(settings.currentYear);
    set.add(currentYearBudget);
    const sorted = Array.from(set).sort((a, b) => b - a);
    yearFilter.innerHTML = sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
    const selected = settings ? settings.currentYear : currentYearBudget;
    yearFilter.value = selected;
    bYearInput.value = selected;
  } catch {
    yearFilter.innerHTML = `<option value="${currentYearBudget}">${currentYearBudget}</option>`;
    bYearInput.value = currentYearBudget;
  }
}

async function loadBudgetSummary() {
  const summaryWrap = document.getElementById('budget-summary');
  const year = document.getElementById('budget-year-filter').value || currentYearBudget;

  summaryWrap.innerHTML = loaderHTML();

  try {
    const summary = await apiFetch(`/budget/summary?year=${year}`);
    summaryWrap.innerHTML = `
      <div class="glass-card stat-card reveal in-view">
        <span class="stat-icon">💸</span>
        <div class="stat-value">₹${Number(summary.totalIncome || 0).toLocaleString('en-IN')}</div>
        <div class="stat-label">Total Income</div>
      </div>
      <div class="glass-card stat-card reveal in-view">
        <span class="stat-icon">💳</span>
        <div class="stat-value">₹${Number(summary.totalExpense || 0).toLocaleString('en-IN')}</div>
        <div class="stat-label">Total Expense</div>
      </div>
      <div class="glass-card stat-card reveal in-view">
        <span class="stat-icon">🏦</span>
        <div class="stat-value">₹${Number(summary.netBalance || 0).toLocaleString('en-IN')}</div>
        <div class="stat-label">Net Balance</div>
      </div>
      <div class="glass-card stat-card reveal in-view">
        <span class="stat-icon">🧾</span>
        <div class="stat-value">${summary.totalEntries || 0}</div>
        <div class="stat-label">Entries</div>
      </div>`;
  } catch (err) {
    summaryWrap.innerHTML = emptyStateHTML('💰', 'Budget summary unavailable', err.message);
  }
}

async function loadBudget() {
  const wrap = document.getElementById('budget-table-wrap');
  const search = document.getElementById('budget-search').value.trim();
  const type = document.getElementById('budget-type-filter').value;
  const year = document.getElementById('budget-year-filter').value || currentYearBudget;

  wrap.innerHTML = loaderHTML();

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (type && type !== 'All') params.set('type', type);
  if (year) params.set('year', year);

  try {
    allBudgetItems = await apiFetch(`/budget?${params.toString()}`);
    renderBudget(allBudgetItems);
  } catch (err) {
    wrap.innerHTML = emptyStateHTML('⚠️', 'Could not load budget items', err.message);
  }
}

function renderBudget(list) {
  const wrap = document.getElementById('budget-table-wrap');

  if (!list.length) {
    wrap.innerHTML = emptyStateHTML('💰', 'No budget entries yet', 'Add your first festival income or expense from the button above.');
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Notes</th>
            <th class="admin-only">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((item) => `
            <tr>
              <td style="font-weight:600;">${item.title}</td>
              <td>${item.category}</td>
              <td>${item.type === 'Income' ? '<span class="badge badge-completed">Income</span>' : '<span class="badge badge-upcoming">Expense</span>'}</td>
              <td>₹${Number(item.amount).toLocaleString('en-IN')}</td>
              <td>${formatDate(item.date)}</td>
              <td>${item.notes ? item.notes : '—'}</td>
              <td class="admin-only">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline edit-budget-btn" data-id="${item._id}">Edit</button>
                  <button class="btn btn-sm btn-danger delete-budget-btn" data-id="${item._id}">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  wrap.querySelectorAll('.edit-budget-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!requireAdmin()) return;
      const item = allBudgetItems.find((x) => x._id === btn.dataset.id);
      openBudgetModal(item);
    });
  });

  wrap.querySelectorAll('.delete-budget-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteBudget(btn.dataset.id));
  });
}

function openBudgetModal(item) {
  document.getElementById('budget-modal-title').textContent = item ? 'Edit Budget Item' : 'Add Budget Item';
  document.getElementById('budget-id').value = item ? item._id : '';
  document.getElementById('b-title').value = item ? item.title : '';
  document.getElementById('b-category').value = item ? item.category : '';
  document.getElementById('b-type').value = item ? item.type : 'Expense';
  document.getElementById('b-amount').value = item ? item.amount : '';
  document.getElementById('b-date').value = item ? new Date(item.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  document.getElementById('b-year').value = item ? item.year : (document.getElementById('budget-year-filter').value || currentYearBudget);
  document.getElementById('b-notes').value = item ? (item.notes || '') : '';
  document.getElementById('budget-modal').classList.add('open');
}

async function submitBudgetForm(e) {
  e.preventDefault();
  const id = document.getElementById('budget-id').value;
  const title = document.getElementById('b-title').value.trim();
  const category = document.getElementById('b-category').value.trim();
  const type = document.getElementById('b-type').value;
  const amount = Number(document.getElementById('b-amount').value);
  const date = document.getElementById('b-date').value;
  const year = Number(document.getElementById('b-year').value);
  const notes = document.getElementById('b-notes').value.trim();

  if (!title || !category || !type || !amount || !date || !year) {
    toast('Please fill in all required fields.', 'error');
    return;
  }

  const payload = { title, category, type, amount, date, year, notes };
  const btn = document.getElementById('budget-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await apiFetch(`/budget/${id}`, { method: 'PUT', body: payload });
      toast('Budget item updated successfully.', 'success');
    } else {
      await apiFetch('/budget', { method: 'POST', body: payload });
      toast('Budget item added successfully.', 'success');
    }

    document.getElementById('budget-modal').classList.remove('open');
    await loadBudget();
    await loadBudgetSummary();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Budget Item';
  }
}

async function deleteBudget(id) {
  if (!requireAdmin()) return;
  const item = allBudgetItems.find((x) => x._id === id);
  const ok = await confirmDialog({
    title: 'Delete Budget Item?',
    message: `This will permanently remove "${item ? item.title : 'this item'}" from the budget records.`,
    confirmText: 'Delete',
  });

  if (!ok) return;

  try {
    await apiFetch(`/budget/${id}`, { method: 'DELETE' });
    toast('Budget item deleted.', 'success');
    await loadBudget();
    await loadBudgetSummary();
  } catch (err) {
    toast(err.message, 'error');
  }
}

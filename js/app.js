/**
 * Expense & Budget Visualizer — app.js
 * Vanilla JS only. No frameworks. LocalStorage persistence.
 */

/* =============================================
   CONSTANTS & STATE
   ============================================= */

const STORAGE_KEY_TRANSACTIONS = 'budget_tracker_transactions';
const STORAGE_KEY_CATEGORIES    = 'budget_tracker_categories';
const STORAGE_KEY_THEME         = 'budget_tracker_theme';
const STORAGE_KEY_SORT          = 'budget_tracker_sort';

/** Built-in categories (cannot be deleted) */
const BUILT_IN_CATEGORIES = [
  { id: 'food',      label: 'Food',      emoji: '🍔', color: '#f59e0b' },
  { id: 'transport', label: 'Transport', emoji: '🚌', color: '#3b82f6' },
  { id: 'fun',       label: 'Fun',       emoji: '🎉', color: '#ec4899' },
];

/** A palette for auto-assigning colors to custom categories */
const COLOR_PALETTE = [
  '#10b981', '#8b5cf6', '#06b6d4', '#f97316',
  '#84cc16', '#e11d48', '#0ea5e9', '#d97706',
  '#7c3aed', '#059669', '#db2777', '#2563eb',
];

/** Application state */
let state = {
  transactions: [],   // { id, name, amount, categoryId, createdAt }
  categories: [],     // { id, label, emoji, color, isBuiltIn }
  theme: 'light',
  sort: 'date-desc',
};

/** Chart.js instance */
let chartInstance = null;

/* =============================================
   INIT
   ============================================= */

function init() {
  loadFromStorage();
  applyTheme(state.theme);
  renderCategoryOptions();
  renderCategoryChips();
  renderTransactions();
  renderChart();
  updateBalance();
  bindEvents();
}

/* =============================================
   LOCAL STORAGE
   ============================================= */

function loadFromStorage() {
  // Transactions
  const rawTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  state.transactions = rawTx ? JSON.parse(rawTx) : [];

  // Custom categories merged with built-ins
  const rawCats = localStorage.getItem(STORAGE_KEY_CATEGORIES);
  const customCats = rawCats ? JSON.parse(rawCats) : [];
  state.categories = [
    ...BUILT_IN_CATEGORIES.map(c => ({ ...c, isBuiltIn: true })),
    ...customCats.map(c => ({ ...c, isBuiltIn: false })),
  ];

  // Theme
  state.theme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';

  // Sort
  state.sort = localStorage.getItem(STORAGE_KEY_SORT) || 'date-desc';
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.value = state.sort;
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(state.transactions));
}

function saveCustomCategories() {
  const custom = state.categories.filter(c => !c.isBuiltIn);
  localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(custom));
}

/* =============================================
   THEME
   ============================================= */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEY_THEME, state.theme);
  applyTheme(state.theme);
  // Redraw chart with updated color scheme
  renderChart();
}

/* =============================================
   CATEGORIES
   ============================================= */

function getCategoryById(id) {
  return state.categories.find(c => c.id === id) || null;
}

/** Populate the <select> in the Add Transaction form */
function renderCategoryOptions() {
  const select = document.getElementById('itemCategory');
  select.innerHTML = '';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.emoji} ${cat.label}`;
    select.appendChild(opt);
  });
}

/** Render category chips in the Manage Categories section */
function renderCategoryChips() {
  const container = document.getElementById('categoryChips');
  container.innerHTML = '';
  state.categories.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = 'chip' + (cat.isBuiltIn ? ' chip-builtin' : '');
    chip.innerHTML = `
      <span>${cat.emoji} ${cat.label}</span>
      <button class="chip-delete" data-id="${cat.id}" aria-label="Delete category ${cat.label}" title="Delete">✕</button>
    `;
    container.appendChild(chip);
  });
}

/** Add a new custom category */
function addCategory(label) {
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: 'Category name cannot be empty.' };

  const isDuplicate = state.categories.some(
    c => c.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) return { ok: false, error: `"${trimmed}" already exists.` };

  // Pick a color from palette, cycling
  const colorIndex = state.categories.filter(c => !c.isBuiltIn).length % COLOR_PALETTE.length;
  const newCat = {
    id: 'cat_' + Date.now(),
    label: trimmed,
    emoji: '📌',
    color: COLOR_PALETTE[colorIndex],
    isBuiltIn: false,
  };
  state.categories.push(newCat);
  saveCustomCategories();
  renderCategoryOptions();
  renderCategoryChips();
  return { ok: true };
}

/** Delete a custom category */
function deleteCategory(id) {
  const cat = getCategoryById(id);
  if (!cat || cat.isBuiltIn) return;

  // Re-assign transactions in this category to 'food' (first built-in)
  state.transactions = state.transactions.map(tx =>
    tx.categoryId === id ? { ...tx, categoryId: 'food' } : tx
  );
  saveTransactions();

  state.categories = state.categories.filter(c => c.id !== id);
  saveCustomCategories();
  renderCategoryOptions();
  renderCategoryChips();
  renderTransactions();
  renderChart();
  updateBalance();
}

/* =============================================
   TRANSACTIONS
   ============================================= */

/** Validate and add a new transaction from the form */
function handleFormSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  const nameEl     = document.getElementById('itemName');
  const amountEl   = document.getElementById('itemAmount');
  const categoryEl = document.getElementById('itemCategory');

  const name     = nameEl.value.trim();
  const amount   = parseFloat(amountEl.value);
  const catId    = categoryEl.value;

  let valid = true;

  if (!name) {
    showFieldError('nameError', 'Item name is required.');
    nameEl.classList.add('input-error');
    valid = false;
  }

  if (!amountEl.value || isNaN(amount) || amount <= 0) {
    showFieldError('amountError', 'Enter a valid amount greater than 0.');
    amountEl.classList.add('input-error');
    valid = false;
  }

  if (!catId) {
    showFieldError('categoryError', 'Please select a category.');
    categoryEl.classList.add('input-error');
    valid = false;
  }

  if (!valid) return;

  const transaction = {
    id: 'tx_' + Date.now(),
    name,
    amount,
    categoryId: catId,
    createdAt: Date.now(),
  };

  state.transactions.push(transaction);
  saveTransactions();
  renderTransactions();
  renderChart();
  updateBalance();

  // Reset form
  e.target.reset();
  nameEl.focus();
}

/** Delete a transaction by id */
function deleteTransaction(id) {
  state.transactions = state.transactions.filter(tx => tx.id !== id);
  saveTransactions();
  renderTransactions();
  renderChart();
  updateBalance();
}

/** Return transactions sorted according to state.sort */
function getSortedTransactions() {
  const copy = [...state.transactions];
  switch (state.sort) {
    case 'date-desc':
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case 'date-asc':
      return copy.sort((a, b) => a.createdAt - b.createdAt);
    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);
    case 'category-asc': {
      const label = id => (getCategoryById(id)?.label || '');
      return copy.sort((a, b) => label(a.categoryId).localeCompare(label(b.categoryId)));
    }
    case 'category-desc': {
      const label = id => (getCategoryById(id)?.label || '');
      return copy.sort((a, b) => label(b.categoryId).localeCompare(label(a.categoryId)));
    }
    default:
      return copy;
  }
}

/** Render the transaction list UI */
function renderTransactions() {
  const list     = document.getElementById('transactionList');
  const emptyMsg = document.getElementById('listEmpty');
  list.innerHTML = '';

  const sorted = getSortedTransactions();

  if (sorted.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  sorted.forEach(tx => {
    const cat = getCategoryById(tx.categoryId);
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = tx.id;

    li.innerHTML = `
      <span class="item-badge" style="background:${hexWithAlpha(cat?.color || '#6b7280', 0.15)}; font-size:1.15rem;">
        ${cat?.emoji || '💸'}
      </span>
      <div class="item-info">
        <div class="item-name">${escapeHTML(tx.name)}</div>
        <div class="item-category">${escapeHTML(cat?.label || 'Unknown')}</div>
      </div>
      <span class="item-amount">$${tx.amount.toFixed(2)}</span>
      <button class="btn btn-danger delete-btn" data-id="${tx.id}" aria-label="Delete ${escapeHTML(tx.name)}">✕</button>
    `;
    list.appendChild(li);
  });
}

/* =============================================
   BALANCE
   ============================================= */

function updateBalance() {
  const total = state.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  document.getElementById('totalBalance').textContent = `$${total.toFixed(2)}`;
}

/* =============================================
   PIE CHART (Chart.js)
   ============================================= */

function renderChart() {
  const canvas    = document.getElementById('spendingChart');
  const emptyNote = document.getElementById('chartEmpty');

  // Build data: sum amounts per category
  const totals = {};
  state.transactions.forEach(tx => {
    totals[tx.categoryId] = (totals[tx.categoryId] || 0) + tx.amount;
  });

  const usedCategories = state.categories.filter(c => totals[c.id]);

  if (usedCategories.length === 0) {
    canvas.style.display = 'none';
    emptyNote.style.display = 'block';
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  canvas.style.display = 'block';
  emptyNote.style.display = 'none';

  const labels = usedCategories.map(c => `${c.emoji} ${c.label}`);
  const data   = usedCategories.map(c => totals[c.id]);
  const colors = usedCategories.map(c => c.color);

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data   = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.data.datasets[0].borderColor      = colors.map(c => hexWithAlpha(c, 0.8));
    chartInstance.update();
    return;
  }

  const isDark = state.theme === 'dark';

  chartInstance = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(c => hexWithAlpha(c, 0.8)),
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#e8eaf0' : '#1a1d27',
            font: { size: 12, weight: '600', family: "'Segoe UI', system-ui, sans-serif" },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const val   = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((val / total) * 100).toFixed(1);
              return ` $${val.toFixed(2)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/* =============================================
   EVENT BINDING
   ============================================= */

function bindEvents() {
  // Form submit
  document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);

  // Delete transaction (event delegation on list)
  document.getElementById('transactionList').addEventListener('click', e => {
    const btn = e.target.closest('.delete-btn');
    if (btn) deleteTransaction(btn.dataset.id);
  });

  // Sort change
  document.getElementById('sortSelect').addEventListener('change', e => {
    state.sort = e.target.value;
    localStorage.setItem(STORAGE_KEY_SORT, state.sort);
    renderTransactions();
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Add custom category
  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    const input = document.getElementById('newCategoryInput');
    const errorEl = document.getElementById('categoryAddError');
    const result = addCategory(input.value);
    if (result.ok) {
      input.value = '';
      errorEl.textContent = '';
    } else {
      errorEl.textContent = result.error;
    }
  });

  // Allow pressing Enter in the category input
  document.getElementById('newCategoryInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('addCategoryBtn').click();
    }
  });

  // Delete custom category (event delegation on chips)
  document.getElementById('categoryChips').addEventListener('click', e => {
    const btn = e.target.closest('.chip-delete');
    if (btn) deleteCategory(btn.dataset.id);
  });

  // Clear input-error styling on user input
  ['itemName', 'itemAmount', 'itemCategory'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      document.getElementById(id).classList.remove('input-error');
    });
  });
}

/* =============================================
   HELPERS
   ============================================= */

function showFieldError(elementId, message) {
  document.getElementById(elementId).textContent = message;
}

function clearFormErrors() {
  ['nameError', 'amountError', 'categoryError'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  ['itemName', 'itemAmount', 'itemCategory'].forEach(id => {
    document.getElementById(id).classList.remove('input-error');
  });
}

/** Safely escape HTML to prevent XSS from user-supplied text */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/**
 * Convert a hex color + alpha to rgba string.
 * e.g. hexWithAlpha('#f59e0b', 0.15) → 'rgba(245,158,11,0.15)'
 */
function hexWithAlpha(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* =============================================
   BOOTSTRAP
   ============================================= */

document.addEventListener('DOMContentLoaded', init);

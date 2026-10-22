// ── State ──────────────────────────────────────────────
  let tasks = JSON.parse(localStorage.getItem('dp_tasks') || '[]');
  let moneyRecords = JSON.parse(localStorage.getItem('dp_money') || '[]');
  let moneyFilter = 'all';
  let editTaskId = null;
  let editMoneyId = null;

  // ── Helpers ────────────────────────────────────────────
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

  function save() {
    localStorage.setItem('dp_tasks', JSON.stringify(tasks));
    localStorage.setItem('dp_money', JSON.stringify(moneyRecords));
  }

  function fmt(n) {
    return '₦' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  }

  // ── Tasks ──────────────────────────────────────────────
  function addTask() {
    const desc = document.getElementById('task-desc').value.trim();
    const time = document.getElementById('task-time').value;
    const err = document.getElementById('task-error');

    if (!desc) { err.textContent = 'Please enter a task description.'; return; }
    err.textContent = '';

    tasks.push({ id: uid(), desc, time });
    save();
    renderTasks();
    document.getElementById('task-desc').value = '';
    document.getElementById('task-time').value = '';
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    renderTasks();
  }

  function openEditTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editTaskId = id;
    document.getElementById('edit-task-desc').value = task.desc;
    document.getElementById('edit-task-time').value = task.time || '';
    document.getElementById('edit-task-error').textContent = '';
    document.getElementById('task-modal').classList.add('open');
  }

  function saveEditTask() {
    const desc = document.getElementById('edit-task-desc').value.trim();
    const time = document.getElementById('edit-task-time').value;
    const err = document.getElementById('edit-task-error');

    if (!desc) { err.textContent = 'Description cannot be empty.'; return; }
    err.textContent = '';

    tasks = tasks.map(t => t.id === editTaskId ? { ...t, desc, time } : t);
    save();
    renderTasks();
    closeModal('task-modal');
  }

  function renderTasks() {
    const list = document.getElementById('task-list');
    if (!tasks.length) {
      list.innerHTML = '<p class="empty">No tasks yet. Add one above!</p>';
      return;
    }
    list.innerHTML = tasks.map(t => `
      <div class="list-item">
        <div class="item-info">
          <div class="item-desc">${escHtml(t.desc)}</div>
          ${t.time ? `<div class="item-meta">⏰ ${fmtTime(t.time)}</div>` : ''}
        </div>
        <div class="item-actions">
          <button class="btn btn-sm btn-edit" onclick="openEditTask('${t.id}')">Edit</button>
          <button class="btn btn-sm btn-delete" onclick="deleteTask('${t.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  // ── Money ──────────────────────────────────────────────
  function addMoney() {
    const desc = document.getElementById('money-desc').value.trim();
    const amount = parseFloat(document.getElementById('money-amount').value);
    const type = document.getElementById('money-type').value;
    const err = document.getElementById('money-error');

    if (!desc) { err.textContent = 'Please enter a description.'; return; }
    if (isNaN(amount) || amount <= 0) { err.textContent = 'Please enter a valid amount.'; return; }
    err.textContent = '';

    moneyRecords.push({ id: uid(), desc, amount, type });
    save();
    renderMoney();
    document.getElementById('money-desc').value = '';
    document.getElementById('money-amount').value = '';
    document.getElementById('money-type').value = 'income';
  }

  function deleteMoney(id) {
    moneyRecords = moneyRecords.filter(r => r.id !== id);
    save();
    renderMoney();
  }

  function openEditMoney(id) {
    const rec = moneyRecords.find(r => r.id === id);
    if (!rec) return;
    editMoneyId = id;
    document.getElementById('edit-money-desc').value = rec.desc;
    document.getElementById('edit-money-amount').value = rec.amount;
    document.getElementById('edit-money-type').value = rec.type;
    document.getElementById('edit-money-error').textContent = '';
    document.getElementById('money-modal').classList.add('open');
  }

  function saveEditMoney() {
    const desc = document.getElementById('edit-money-desc').value.trim();
    const amount = parseFloat(document.getElementById('edit-money-amount').value);
    const type = document.getElementById('edit-money-type').value;
    const err = document.getElementById('edit-money-error');

    if (!desc) { err.textContent = 'Description cannot be empty.'; return; }
    if (isNaN(amount) || amount <= 0) { err.textContent = 'Please enter a valid amount.'; return; }
    err.textContent = '';

    moneyRecords = moneyRecords.map(r => r.id === editMoneyId ? { ...r, desc, amount, type } : r);
    save();
    renderMoney();
    closeModal('money-modal');
  }

  function setFilter(f, btn) {
    moneyFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMoney();
  }

  function renderMoney() {
    const income = moneyRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = moneyRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const balance = income - expense;

    document.getElementById('total-income').textContent = fmt(income);
    document.getElementById('total-expense').textContent = fmt(expense);
    const balEl = document.getElementById('total-balance');
    balEl.textContent = fmt(balance);
    balEl.style.color = balance < 0 ? '#FCA5A5' : '';

    const filtered = moneyFilter === 'all' ? moneyRecords : moneyRecords.filter(r => r.type === moneyFilter);
    const list = document.getElementById('money-list');

    if (!filtered.length) {
      list.innerHTML = '<p class="empty">No records found.</p>';
      return;
    }

    list.innerHTML = filtered.map(r => `
      <div class="list-item">
        <div class="item-info">
          <div class="item-desc">${escHtml(r.desc)}</div>
          <div class="item-meta">
            <span class="badge badge-${r.type}">${r.type === 'income' ? '▲ Income' : '▼ Expense'}</span>
          </div>
        </div>
        <div style="font-weight:700;color:${r.type === 'income' ? '#065F46' : '#991B1B'};white-space:nowrap;">
          ${r.type === 'income' ? '+' : '-'}${fmt(r.amount)}
        </div>
        <div class="item-actions">
          <button class="btn btn-sm btn-edit" onclick="openEditMoney('${r.id}')">Edit</button>
          <button class="btn btn-sm btn-delete" onclick="deleteMoney('${r.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  // ── Modal ──────────────────────────────────────────────
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // ── XSS guard ─────────────────────────────────────────
  function escHtml(str) {
    return str.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
  }

  // ── Enter key shortcuts ────────────────────────────────
  document.getElementById('task-desc').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  document.getElementById('money-amount').addEventListener('keydown', e => { if (e.key === 'Enter') addMoney(); });

  // ── Init ───────────────────────────────────────────────
  renderTasks();
  renderMoney();
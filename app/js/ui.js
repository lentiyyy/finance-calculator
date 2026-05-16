// Модуль рендеринга интерфейса и форматирования значений.

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});

export function formatMoney(value) {
    return moneyFormatter.format(value || 0);
}

export function formatDate(isoDate) {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return dateFormatter.format(d);
}

export function renderSummary({ totalIncome, totalExpense, balance }) {
    document.getElementById('totalIncome').textContent = formatMoney(totalIncome);
    document.getElementById('totalExpense').textContent = formatMoney(totalExpense);
    const balanceEl = document.getElementById('balance');
    balanceEl.textContent = formatMoney(balance);
    balanceEl.classList.toggle('summary-value--negative', balance < 0);
    balanceEl.classList.toggle('summary-value--positive', balance > 0);
}

export function renderTransactions(transactions, onEdit, onDelete) {
    const tbody = document.getElementById('transactionsBody');
    const empty = document.getElementById('emptyState');
    const count = document.getElementById('txCount');

    tbody.innerHTML = '';
    count.textContent = String(transactions.length);

    if (transactions.length === 0) {
        empty.hidden = false;
        return;
    }
    empty.hidden = true;

    const fragment = document.createDocumentFragment();
    for (const t of transactions) {
        fragment.appendChild(buildRow(t, onEdit, onDelete));
    }
    tbody.appendChild(fragment);
}

export function renderStats(stats) {
    const container = document.getElementById('statsContent');
    container.innerHTML = '';

    const expenseItems = stats.expenseByCategory;

    if (expenseItems.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Нет данных за выбранный период';
        container.appendChild(empty);
        return;
    }

    for (const item of expenseItems) {
        const row = document.createElement('div');
        row.className = 'stats-expense-row';

        const line = document.createElement('div');
        line.className = 'stats-expense-line';

        const percent = item.percent.toFixed(1);
        line.textContent = `${item.category}: ${formatMoney(item.amount)} (${percent}%)`;

        const bar = document.createElement('pre');
        bar.className = 'stats-expense-bar';
        bar.textContent = buildTextBar(item.percent);

        row.append(line, bar);
        container.appendChild(row);
    }
}

export function renderBudgetFields(categories, budgets) {
    const container = document.getElementById('budgetFields');
    container.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (const category of categories) {
        const label = document.createElement('label');
        label.className = 'form-field budget-field';

        const title = document.createElement('span');
        title.textContent = category;

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = '0.01';
        input.name = category;
        input.placeholder = 'Без лимита';
        input.value = budgets[category] ? String(budgets[category]) : '';

        label.append(title, input);
        fragment.appendChild(label);
    }

    container.appendChild(fragment);
}

export function renderBudgetStatus(items) {
    const container = document.getElementById('budgetStatus');
    container.innerHTML = '';

    if (items.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Бюджеты не заданы';
        container.appendChild(empty);
        return;
    }

    for (const item of items) {
        const row = document.createElement('div');
        row.className = 'budget-row';
        row.classList.toggle('budget-row--over', item.left < 0);

        const label = document.createElement('div');
        label.className = 'budget-label';
        label.textContent = `${item.category}: ${formatMoney(item.spent)} из ${formatMoney(item.limit)}`;

        const meter = document.createElement('div');
        meter.className = 'budget-meter';

        const fill = document.createElement('span');
        fill.className = 'budget-meter__fill';
        fill.style.width = `${Math.min(100, Math.max(0, item.percent))}%`;
        meter.appendChild(fill);

        const rest = document.createElement('div');
        rest.className = 'budget-rest';
        rest.textContent = item.left >= 0
            ? `Осталось ${formatMoney(item.left)}`
            : `Превышение ${formatMoney(Math.abs(item.left))}`;

        row.append(label, meter, rest);
        container.appendChild(row);
    }
}

function buildTextBar(percent) {
    const safe = Math.max(0, Math.min(100, percent));
    const totalBars = 24; // длина полосы в символах '#'
    const count = Math.round((safe / 100) * totalBars);
    const hashes = '#'.repeat(count);
    return hashes;
}

export function showToast(message, kind = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast--visible toast--${kind}`;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        toast.className = 'toast';
    }, 2800);
}

function buildRow(t, onEdit, onDelete) {
    const tr = document.createElement('tr');
    tr.classList.add(t.type === 'income' ? 'row--income' : 'row--expense');

    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(t.date);
    tr.appendChild(dateCell);

    const typeCell = document.createElement('td');
    const typeBadge = document.createElement('span');
    typeBadge.className = `type-badge type-badge--${t.type}`;
    typeBadge.textContent = t.type === 'income' ? 'Доход' : 'Расход';
    typeCell.appendChild(typeBadge);
    tr.appendChild(typeCell);

    const categoryCell = document.createElement('td');
    const categoryWrap = document.createElement('div');
    categoryWrap.className = `category-meta category-meta--${t.type}`;

    const categoryName = document.createElement('span');
    categoryName.className = 'category-name';
    categoryName.textContent = t.category;

    const categoryKind = document.createElement('span');
    categoryKind.className = 'category-kind';
    categoryKind.textContent = t.type === 'income' ? 'Доход' : 'Расход';

    categoryWrap.append(categoryName, categoryKind);
    categoryCell.appendChild(categoryWrap);
    tr.appendChild(categoryCell);

    const amountCell = document.createElement('td');
    amountCell.className = 'num';
    const sign = t.type === 'income' ? '+' : '−';
    amountCell.textContent = `${sign} ${formatMoney(t.amount)}`;
    tr.appendChild(amountCell);

    const commentCell = document.createElement('td');
    commentCell.textContent = t.comment || '—';
    commentCell.title = t.comment || '';
    tr.appendChild(commentCell);

    const actionCell = document.createElement('td');
    actionCell.className = 'actions-cell';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn--icon';
    editBtn.setAttribute('aria-label', 'Редактировать транзакцию');
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => onEdit(t.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--icon';
    deleteBtn.setAttribute('aria-label', 'Удалить транзакцию');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => onDelete(t.id));
    actionCell.append(editBtn, deleteBtn);
    tr.appendChild(actionCell);

    return tr;
}

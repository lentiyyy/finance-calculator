// Модуль рендеринга интерфейса и форматирования значений.

import { buildBar } from './stats.js';

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

export function renderTransactions(transactions, onDelete) {
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
        fragment.appendChild(buildRow(t, onDelete));
    }
    tbody.appendChild(fragment);
}

export function renderStats(stats) {
    const container = document.getElementById('statsContent');
    container.innerHTML = '';

    const hasData = stats.expenseByCategory.length > 0 || stats.incomeByCategory.length > 0;
    if (!hasData) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Нет данных за выбранный период';
        container.appendChild(empty);
        return;
    }

    if (stats.expenseByCategory.length > 0) {
        container.appendChild(buildStatsBlock('Расходы по категориям', stats.expenseByCategory, 'expense'));
    }
    if (stats.incomeByCategory.length > 0) {
        container.appendChild(buildStatsBlock('Доходы по категориям', stats.incomeByCategory, 'income'));
    }
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

function buildRow(t, onDelete) {
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
    categoryCell.textContent = t.category;
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
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--icon';
    deleteBtn.setAttribute('aria-label', 'Удалить транзакцию');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => onDelete(t.id));
    actionCell.appendChild(deleteBtn);
    tr.appendChild(actionCell);

    return tr;
}

function buildStatsBlock(title, items, kind) {
    const block = document.createElement('div');
    block.className = 'stats-block';

    const heading = document.createElement('h3');
    heading.textContent = title;
    block.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'stats-list';

    for (const item of items) {
        const li = document.createElement('li');
        li.className = `stats-row stats-row--${kind}`;

        const label = document.createElement('span');
        label.className = 'stats-label';
        label.textContent = item.category;

        const bar = document.createElement('span');
        bar.className = 'stats-bar';
        bar.textContent = buildBar(item.percent);

        const value = document.createElement('span');
        value.className = 'stats-value';
        value.textContent = `${formatMoney(item.amount)} (${item.percent.toFixed(1)}%)`;

        li.append(label, bar, value);
        list.appendChild(li);
    }

    block.appendChild(list);
    return block;
}

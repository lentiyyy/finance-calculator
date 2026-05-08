// Точка входа: связывает модули, регистрирует обработчики событий и управляет состоянием приложения.

import { loadTransactions, saveTransactions } from './storage.js';
import { createTransaction, removeTransactionById, sortByDateDesc, validateInput } from './transactions.js';
import { applyFilters } from './filters.js';
import { calculateStats } from './stats.js';
import { renderSummary, renderTransactions, renderStats, showToast } from './ui.js';
import { exportTransactionsToCsv } from './csv.js';

const state = {
    transactions: [],
    filters: {
        period: 'all',
        dateFrom: '',
        dateTo: '',
        type: 'all',
        category: 'all',
        search: ''
    }
};

function init() {
    state.transactions = loadTransactions();
    setDefaultDate();
    bindForm();
    bindFilters();
    bindExport();
    rerender();
}

function setDefaultDate() {
    const dateInput = document.getElementById('date');
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    dateInput.value = iso;
    dateInput.max = iso;
}

function bindForm() {
    const form = document.getElementById('transactionForm');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        const input = {
            type: formData.get('type'),
            amount: formData.get('amount'),
            category: formData.get('category'),
            date: formData.get('date'),
            comment: formData.get('comment')
        };
        const errors = validateInput(input);
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }
        try {
            const transaction = createTransaction(input);
            state.transactions.push(transaction);
            persist();
            form.reset();
            setDefaultDate();
            showToast('Транзакция добавлена', 'success');
            rerender();
        } catch (err) {
            showToast(err.message || 'Не удалось сохранить транзакцию', 'error');
        }
    });
}

function bindFilters() {
    const periodSelect = document.getElementById('filterPeriod');
    const dateFromField = document.getElementById('dateFromField');
    const dateToField = document.getElementById('dateToField');
    const dateFromInput = document.getElementById('filterDateFrom');
    const dateToInput = document.getElementById('filterDateTo');
    const typeSelect = document.getElementById('filterType');
    const categorySelect = document.getElementById('filterCategory');
    const searchInput = document.getElementById('filterSearch');
    const resetBtn = document.getElementById('resetFilters');

    periodSelect.addEventListener('change', () => {
        state.filters.period = periodSelect.value;
        const isCustom = periodSelect.value === 'custom';
        dateFromField.hidden = !isCustom;
        dateToField.hidden = !isCustom;
        rerender();
    });

    dateFromInput.addEventListener('change', () => {
        state.filters.dateFrom = dateFromInput.value;
        rerender();
    });
    dateToInput.addEventListener('change', () => {
        state.filters.dateTo = dateToInput.value;
        rerender();
    });

    typeSelect.addEventListener('change', () => {
        state.filters.type = typeSelect.value;
        rerender();
    });
    categorySelect.addEventListener('change', () => {
        state.filters.category = categorySelect.value;
        rerender();
    });

    let searchTimeout = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.filters.search = searchInput.value;
            rerender();
        }, 200);
    });

    resetBtn.addEventListener('click', () => {
        periodSelect.value = 'all';
        typeSelect.value = 'all';
        categorySelect.value = 'all';
        searchInput.value = '';
        dateFromInput.value = '';
        dateToInput.value = '';
        dateFromField.hidden = true;
        dateToField.hidden = true;
        state.filters = { period: 'all', dateFrom: '', dateTo: '', type: 'all', category: 'all', search: '' };
        rerender();
    });
}

function bindExport() {
    document.getElementById('exportCsv').addEventListener('click', () => {
        const filtered = getFilteredTransactions();
        if (filtered.length === 0) {
            showToast('Нет данных для экспорта', 'error');
            return;
        }
        exportTransactionsToCsv(filtered, `transactions-${todayStamp()}.csv`);
        showToast('Файл выгружен', 'success');
    });
}

function handleDelete(id) {
    const target = state.transactions.find(t => t.id === id);
    if (!target) return;
    const confirmed = window.confirm('Удалить транзакцию?');
    if (!confirmed) return;
    state.transactions = removeTransactionById(state.transactions, id);
    persist();
    showToast('Транзакция удалена', 'success');
    rerender();
}

function getFilteredTransactions() {
    return sortByDateDesc(applyFilters(state.transactions, state.filters));
}

function rerender() {
    const visible = getFilteredTransactions();
    renderTransactions(visible, handleDelete);
    renderStats(calculateStats(visible));
    renderSummary(calculateStats(visible));
}

function persist() {
    const ok = saveTransactions(state.transactions);
    if (!ok) {
        showToast('Не удалось сохранить данные', 'error');
    }
}

function todayStamp() {
    return new Date().toISOString().slice(0, 10);
}

init();

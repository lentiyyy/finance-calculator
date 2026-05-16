// Точка входа: связывает модули, регистрирует обработчики событий и управляет состоянием приложения.

import { clearBudgets, loadBudgets, loadTransactions, saveBudgets, saveTransactions } from './storage.js';
import {
    EXPENSE_CATEGORIES,
    createTransaction,
    getCategoriesByType,
    getTodayDate,
    removeTransactionById,
    sortByDateDesc,
    updateTransactionById,
    validateInput
} from './transactions.js';
import { applyFilters } from './filters.js';
import { calculateBudgetStatus, calculateStats } from './stats.js';
import { downloadCsv } from './export.js';
import {
    renderBudgetFields,
    renderBudgetStatus,
    renderSummary,
    renderTransactions,
    renderStats,
    showToast
} from './ui.js';

const state = {
    transactions: [],
    budgets: {},
    editingId: null,
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
    state.budgets = loadBudgets();

    setDefaultDate();
    initCategoryFields();
    bindForm();
    bindFilters();
    bindDataActions();
    bindBudgets();
    rerender();
}

function buildSampleTransactionsForCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    const isoDate = (day) => {
        const dateMonth = String(month + 1).padStart(2, '0');
        const dateDay = String(day).padStart(2, '0');
        return `${year}-${dateMonth}-${dateDay}`;
    };

    const expenseCategories = getCategoriesByType('expense');
    const incomeCategories = getCategoriesByType('income');

    const pick = (arr, idx) => arr[idx % arr.length];

    const lastAllowedDay = Math.min(now.getDate(), new Date(year, month + 1, 0).getDate());
    const dayList = [1, 2, 4, 7, 9, 12, 14, 18, 20, 23, 26, 28, 30].filter(d => d <= lastAllowedDay);

    const tx = [];
    // расходы
    for (let i = 0; i < dayList.length; i++) {
        const day = dayList[i];
        tx.push({
            id: crypto.randomUUID ? crypto.randomUUID() : String(`sample-exp-${year}-${month}-${i}-${Date.now()}`),
            type: 'expense',
            amount: [1250.5, 3200, 780, 1640, 2499.99, 930, 5100, 1420.25, 1999, 850.75][i % 10],
            category: pick(expenseCategories, i),
            date: isoDate(day),
            comment: ['продукты', 'проезд', 'коммунальные', 'развлечения', 'здоровье'][i % 5]
        });
    }

    // доходы (меньше записей)
    const incomeDays = [2, 3, 10, 15, 22, 27].filter(d => d <= lastAllowedDay);
    for (let i = 0; i < incomeDays.length; i++) {
        const day = incomeDays[i];
        tx.push({
            id: crypto.randomUUID ? crypto.randomUUID() : String(`sample-inc-${year}-${month}-${i}-${Date.now()}`),
            type: 'income',
            amount: [35000, 42000, 28000, 50000, 31000][i % 5],
            category: pick(incomeCategories, i),
            date: isoDate(day),
            comment: ['зарплата', 'подработка', 'возврат', 'доп. доход'][i % 4]
        });
    }

    return tx;
}

function setDefaultDate() {
    const dateInput = document.getElementById('date');
    const iso = getTodayDate();
    dateInput.value = iso;
    dateInput.max = iso;
}

function initCategoryFields() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const filterCategorySelect = document.getElementById('filterCategory');
    const filterTypeSelect = document.getElementById('filterType');

    populateTransactionCategories(typeSelect.value, categorySelect);
    populateFilterCategories(filterTypeSelect.value, filterCategorySelect);
    syncCategoryLabel(typeSelect.value);

    typeSelect.addEventListener('change', () => {
        updateCategoryMode(typeSelect.value, categorySelect);
    });

    filterTypeSelect.addEventListener('change', () => {
        updateFilterCategoryMode(filterTypeSelect.value, filterCategorySelect);
    });
}

function bindForm() {
    const form = document.getElementById('transactionForm');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');

    form.addEventListener('submit', event => {
        event.preventDefault();
        const input = getFormInput(form);
        const errors = validateInput(input);
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }
        try {
            if (state.editingId) {
                state.transactions = updateTransactionById(state.transactions, state.editingId, input);
                showToast('Транзакция обновлена', 'success');
            } else {
                const transaction = createTransaction(input);
                state.transactions.push(transaction);
                showToast('Транзакция добавлена', 'success');
            }
            persist();
            form.reset();
            exitEditMode();
            rerender();
        } catch (err) {
            showToast(err.message || 'Не удалось сохранить транзакцию', 'error');
        }
    });

    form.addEventListener('reset', () => {
        queueMicrotask(() => {
            updateCategoryMode(typeSelect.value, categorySelect);
            setDefaultDate();
        });
    });

    document.getElementById('cancelEdit').addEventListener('click', () => {
        form.reset();
        exitEditMode();
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
        updateFilterCategoryMode(typeSelect.value, categorySelect);
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
        updateFilterCategoryMode('all', categorySelect);
        rerender();
    });
}

function bindDataActions() {
    document.getElementById('loadDemoData').addEventListener('click', () => {
        const confirmed = state.transactions.length === 0 || window.confirm('Заменить текущие транзакции демо-данными?');
        if (!confirmed) return;
        state.transactions = buildSampleTransactionsForCurrentMonth();
        persist();
        exitEditMode();
        showToast('Демо-данные загружены', 'success');
        rerender();
    });

    document.getElementById('exportCsv').addEventListener('click', () => {
        const visible = getFilteredTransactions();
        if (visible.length === 0) {
            showToast('Нет транзакций для экспорта', 'error');
            return;
        }
        downloadCsv(visible);
        showToast('CSV-файл подготовлен', 'success');
    });

    document.getElementById('clearData').addEventListener('click', () => {
        if (state.transactions.length === 0) {
            showToast('Список уже пуст', 'info');
            return;
        }
        const confirmed = window.confirm('Удалить все транзакции? Это действие нельзя отменить.');
        if (!confirmed) return;
        state.transactions = [];
        persist();
        exitEditMode();
        showToast('Все транзакции удалены', 'success');
        rerender();
    });
}

function bindBudgets() {
    const form = document.getElementById('budgetForm');
    const resetBtn = document.getElementById('resetBudgets');

    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        const budgets = {};

        for (const category of EXPENSE_CATEGORIES) {
            const raw = formData.get(category);
            if (!raw) continue;
            const value = Number(raw);
            if (!Number.isFinite(value) || value < 0) {
                showToast(`Некорректный бюджет: ${category}`, 'error');
                return;
            }
            if (value > 0) {
                budgets[category] = Math.round(value * 100) / 100;
            }
        }

        state.budgets = budgets;
        if (saveBudgets(state.budgets)) {
            showToast('Бюджеты сохранены', 'success');
        } else {
            showToast('Не удалось сохранить бюджеты', 'error');
        }
        rerender();
    });

    resetBtn.addEventListener('click', () => {
        state.budgets = {};
        clearBudgets();
        showToast('Бюджеты сброшены', 'success');
        rerender();
    });
}

function handleEdit(id) {
    const target = state.transactions.find(t => t.id === id);
    if (!target) return;
    const form = document.getElementById('transactionForm');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');

    state.editingId = id;
    typeSelect.value = target.type;
    updateCategoryMode(target.type, categorySelect);
    categorySelect.value = target.category;
    form.elements.amount.value = String(target.amount);
    form.elements.date.value = target.date;
    form.elements.comment.value = target.comment || '';
    document.getElementById('formTitle').textContent = 'Редактирование транзакции';
    document.getElementById('submitTransaction').textContent = 'Сохранить';
    document.getElementById('cancelEdit').hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleDelete(id) {
    const target = state.transactions.find(t => t.id === id);
    if (!target) return;
    const confirmed = window.confirm('Удалить транзакцию?');
    if (!confirmed) return;
    state.transactions = removeTransactionById(state.transactions, id);
    if (state.editingId === id) {
        exitEditMode();
    }
    persist();
    showToast('Транзакция удалена', 'success');
    rerender();
}

function getFilteredTransactions() {
    return sortByDateDesc(applyFilters(state.transactions, state.filters));
}

function rerender() {
    const visible = getFilteredTransactions();
    const stats = calculateStats(visible);
    const budgetStatus = calculateBudgetStatus(stats.expenseByCategory, state.budgets);
    renderTransactions(visible, handleEdit, handleDelete);
    renderSummary(stats);
    renderStats(stats);
    renderBudgetFields(EXPENSE_CATEGORIES, state.budgets);
    renderBudgetStatus(budgetStatus);
}

function persist() {
    const ok = saveTransactions(state.transactions);
    if (!ok) {
        showToast('Не удалось сохранить данные', 'error');
    }
}

function getFormInput(form) {
    const formData = new FormData(form);
    return {
        type: formData.get('type'),
        amount: formData.get('amount'),
        category: formData.get('category'),
        date: formData.get('date'),
        comment: formData.get('comment')
    };
}

function exitEditMode() {
    state.editingId = null;
    document.getElementById('formTitle').textContent = 'Новая транзакция';
    document.getElementById('submitTransaction').textContent = 'Добавить';
    document.getElementById('cancelEdit').hidden = true;
    setDefaultDate();
}

function populateTransactionCategories(type, selectEl) {
    const categories = getCategoriesByType(type);
    const currentValue = selectEl.value;
    selectEl.innerHTML = '';

    for (const category of categories) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        selectEl.appendChild(option);
    }

    if (categories.includes(currentValue)) {
        selectEl.value = currentValue;
    } else {
        selectEl.selectedIndex = 0;
    }
}

function updateCategoryMode(type, selectEl) {
    populateTransactionCategories(type, selectEl);
    syncCategoryLabel(type);
    selectEl.setAttribute('aria-label', type === 'income' ? 'Категория дохода' : 'Категория расхода');
}

function populateFilterCategories(type, selectEl) {
    selectEl.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Все';
    selectEl.appendChild(allOption);

    const groups = type === 'income'
        ? [{ label: 'Доходы', type: 'income' }]
        : type === 'expense'
            ? [{ label: 'Расходы', type: 'expense' }]
            : [
                { label: 'Доходы', type: 'income' },
                { label: 'Расходы', type: 'expense' }
            ];

    for (const group of groups) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.label;
        for (const category of getCategoriesByType(group.type)) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            optgroup.appendChild(option);
        }
        selectEl.appendChild(optgroup);
    }

    selectEl.value = 'all';
}

function syncCategoryLabel(type) {
    const label = document.getElementById('categoryLabel');
    if (!label) return;
    label.textContent = type === 'income' ? 'Категория дохода' : 'Категория расхода';
}

function updateFilterCategoryMode(type, selectEl) {
    const currentValue = selectEl.value;
    populateFilterCategories(type, selectEl);

    if (currentValue === 'all') {
        selectEl.value = 'all';
        return;
    }

    const categories = type === 'all' ? [
        ...getCategoriesByType('income'),
        ...getCategoriesByType('expense')
    ] : getCategoriesByType(type);

    selectEl.value = categories.includes(currentValue) ? currentValue : 'all';
}

init();

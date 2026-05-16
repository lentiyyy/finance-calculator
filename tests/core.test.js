import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCsv } from '../app/js/export.js';
import { applyFilters } from '../app/js/filters.js';
import { calculateBudgetStatus, calculateStats } from '../app/js/stats.js';

const transactions = [
    { id: '1', type: 'income', amount: 5000, category: 'Зарплата', date: '2026-05-01', comment: 'аванс' },
    { id: '2', type: 'expense', amount: 1500, category: 'Еда', date: '2026-05-02', comment: 'продукты' },
    { id: '3', type: 'expense', amount: 500, category: 'Транспорт', date: '2026-05-03', comment: '' }
];

test('calculateStats returns totals, balance and category percents', () => {
    const stats = calculateStats(transactions);

    assert.equal(stats.totalIncome, 5000);
    assert.equal(stats.totalExpense, 2000);
    assert.equal(stats.balance, 3000);
    assert.deepEqual(stats.expenseByCategory.map(item => item.category), ['Еда', 'Транспорт']);
    assert.equal(stats.expenseByCategory[0].percent, 75);
});

test('applyFilters filters by type, category, date range and comment search', () => {
    const result = applyFilters(transactions, {
        period: 'custom',
        dateFrom: '2026-05-01',
        dateTo: '2026-05-02',
        type: 'expense',
        category: 'Еда',
        search: 'про'
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].id, '2');
});

test('calculateBudgetStatus shows remaining and over-limit values', () => {
    const stats = calculateStats(transactions);
    const budgetStatus = calculateBudgetStatus(stats.expenseByCategory, {
        Еда: 1000,
        Транспорт: 700
    });

    assert.equal(budgetStatus[0].category, 'Еда');
    assert.equal(budgetStatus[0].left, -500);
    assert.equal(budgetStatus[1].left, 200);
});

test('buildCsv escapes cells and includes readable headers', () => {
    const csv = buildCsv([
        { id: '1', type: 'expense', amount: 100, category: 'Еда', date: '2026-05-01', comment: 'молоко; хлеб' }
    ]);

    assert.match(csv, /^Дата;Тип;Категория;Сумма;Комментарий/);
    assert.match(csv, /"молоко; хлеб"/);
});

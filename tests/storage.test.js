import test from 'node:test';
import assert from 'node:assert/strict';

import { getTodayDate } from '../app/js/transactions.js';
import { loadBudgets, loadTransactions, saveBudgets, saveTransactions } from '../app/js/storage.js';

function installLocalStorageMock() {
    const data = new Map();
    globalThis.localStorage = {
        getItem: key => data.has(key) ? data.get(key) : null,
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: key => data.delete(key),
        clear: () => data.clear()
    };
}

test('storage saves and loads valid transactions only', () => {
    installLocalStorageMock();
    const today = getTodayDate();

    saveTransactions([
        { id: 'valid', type: 'expense', amount: 200, category: 'Еда', date: today, comment: 'ok' },
        { id: 'future', type: 'expense', amount: 200, category: 'Еда', date: '2999-01-01', comment: 'bad' },
        { id: 'bad-category', type: 'income', amount: 100, category: 'Еда', date: today, comment: 'bad' }
    ]);

    const loaded = loadTransactions();
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'valid');
});

test('storage saves positive expense budgets only', () => {
    installLocalStorageMock();

    saveBudgets({
        Еда: 1000,
        Транспорт: 0,
        unknown: 500
    });

    assert.deepEqual(loadBudgets(), { Еда: 1000 });
});

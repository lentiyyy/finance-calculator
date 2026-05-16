import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createTransaction,
    getTodayDate,
    isValidDateOnly,
    updateTransactionById,
    validateInput
} from '../app/js/transactions.js';

test('validateInput accepts a correct transaction', () => {
    const errors = validateInput({
        type: 'expense',
        amount: '1500.50',
        category: 'Еда',
        date: getTodayDate(),
        comment: 'продукты'
    });

    assert.deepEqual(errors, []);
});

test('validateInput rejects impossible and future dates', () => {
    assert.equal(isValidDateOnly('2026-02-31'), false);
    assert.match(
        validateInput({
            type: 'expense',
            amount: '100',
            category: 'Еда',
            date: '2999-01-01',
            comment: ''
        }).join('; '),
        /Дата не может быть позже текущей/
    );
});

test('createTransaction normalizes money and trims comments', () => {
    const transaction = createTransaction({
        type: 'income',
        amount: '100.129',
        category: 'Зарплата',
        date: getTodayDate(),
        comment: '  аванс  '
    });

    assert.equal(transaction.amount, 100.13);
    assert.equal(transaction.comment, 'аванс');
    assert.equal(transaction.type, 'income');
    assert.ok(transaction.id);
});

test('updateTransactionById changes data and keeps id', () => {
    const original = [{
        id: 'tx-1',
        type: 'expense',
        amount: 100,
        category: 'Еда',
        date: getTodayDate(),
        comment: 'old'
    }];

    const updated = updateTransactionById(original, 'tx-1', {
        type: 'expense',
        amount: '250',
        category: 'Транспорт',
        date: getTodayDate(),
        comment: 'metro'
    });

    assert.equal(updated[0].id, 'tx-1');
    assert.equal(updated[0].amount, 250);
    assert.equal(updated[0].category, 'Транспорт');
    assert.equal(updated[0].comment, 'metro');
});

// Модуль работы с localStorage. Сериализация/десериализация массива транзакций.

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getTodayDate, isValidDateOnly } from './transactions.js';

const STORAGE_KEY = 'finance-calc:transactions:v1';
const BUDGETS_KEY = 'finance-calc:budgets:v1';

export function loadTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isValidStoredTransaction);
    } catch (err) {
        console.error('Ошибка чтения localStorage:', err);
        return [];
    }
}

export function saveTransactions(transactions) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (err) {
        console.error('Ошибка записи в localStorage:', err);
        return false;
    }
}

export function loadBudgets() {
    try {
        const raw = localStorage.getItem(BUDGETS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        const result = {};
        for (const category of EXPENSE_CATEGORIES) {
            const value = Number(parsed[category]);
            if (Number.isFinite(value) && value > 0) {
                result[category] = Math.round(value * 100) / 100;
            }
        }
        return result;
    } catch (err) {
        console.error('Ошибка чтения бюджетов localStorage:', err);
        return {};
    }
}

export function saveBudgets(budgets) {
    try {
        localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
        return true;
    } catch (err) {
        console.error('Ошибка записи бюджетов localStorage:', err);
        return false;
    }
}

export function clearBudgets() {
    try {
        localStorage.removeItem(BUDGETS_KEY);
        return true;
    } catch (err) {
        console.error('Ошибка очистки бюджетов localStorage:', err);
        return false;
    }
}

function isValidStoredTransaction(item) {
    return (
        item &&
        typeof item.id === 'string' &&
        (item.type === 'income' || item.type === 'expense') &&
        typeof item.amount === 'number' &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        typeof item.category === 'string' &&
        getCategoriesForStoredType(item.type).includes(item.category) &&
        typeof item.date === 'string' &&
        isValidDateOnly(item.date) &&
        item.date <= getTodayDate() &&
        (typeof item.comment === 'undefined' || typeof item.comment === 'string')
    );
}

function getCategoriesForStoredType(type) {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

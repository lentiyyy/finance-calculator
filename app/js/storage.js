// Модуль работы с localStorage. Сериализация/десериализация массива транзакций.

const STORAGE_KEY = 'finance-calc:transactions:v1';

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

function isValidStoredTransaction(item) {
    return (
        item &&
        typeof item.id === 'string' &&
        (item.type === 'income' || item.type === 'expense') &&
        typeof item.amount === 'number' &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        typeof item.category === 'string' &&
        typeof item.date === 'string' &&
        !Number.isNaN(Date.parse(item.date))
    );
}

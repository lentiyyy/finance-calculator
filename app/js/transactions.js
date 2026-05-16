// Модуль операций над транзакциями: создание, валидация, удаление, генерация id.

export const EXPENSE_CATEGORIES = ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Здоровье', 'Другие'];
export const INCOME_CATEGORIES = ['Зарплата', 'Премия', 'Подработка', 'Возврат', 'Проценты', 'Другие'];
export const TYPES = ['income', 'expense'];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function createTransaction(input) {
    const errors = validateInput(input);
    if (errors.length > 0) {
        const error = new Error(errors.join('; '));
        error.validation = errors;
        throw error;
    }
    return {
        id: generateId(),
        ...normalizeTransaction(input)
    };
}

export function updateTransactionById(transactions, id, input) {
    const errors = validateInput(input);
    if (errors.length > 0) {
        const error = new Error(errors.join('; '));
        error.validation = errors;
        throw error;
    }
    return transactions.map(transaction => (
        transaction.id === id
            ? { ...transaction, ...normalizeTransaction(input) }
            : transaction
    ));
}

export function validateInput(input) {
    const errors = [];
    if (!input || typeof input !== 'object') {
        return ['Некорректные входные данные'];
    }
    if (!TYPES.includes(input.type)) {
        errors.push('Не выбран тип транзакции');
    }
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        errors.push('Сумма должна быть положительным числом');
    }
    const categories = getCategoriesByType(input.type);
    if (!categories.includes(input.category)) {
        errors.push(input.type === 'income' ? 'Не выбрана категория дохода' : 'Не выбрана категория расхода');
    }
    if (!isValidDateOnly(input.date)) {
        errors.push('Не указана корректная дата');
    } else if (input.date > getTodayDate()) {
        errors.push('Дата не может быть позже текущей');
    }
    if (input.comment && typeof input.comment === 'string' && input.comment.length > 120) {
        errors.push('Комментарий не может быть длиннее 120 символов');
    }
    return errors;
}

export function getCategoriesByType(type) {
    if (type === 'income') return INCOME_CATEGORIES;
    if (type === 'expense') return EXPENSE_CATEGORIES;
    return [];
}

export function removeTransactionById(transactions, id) {
    return transactions.filter(t => t.id !== id);
}

export function sortByDateDesc(transactions) {
    return [...transactions].sort((a, b) => {
        const diff = new Date(b.date) - new Date(a.date);
        if (diff !== 0) return diff;
        return b.id.localeCompare(a.id);
    });
}

function roundMoney(value) {
    return Math.round(value * 100) / 100;
}

function normalizeTransaction(input) {
    return {
        type: input.type,
        amount: roundMoney(Number(input.amount)),
        category: input.category,
        date: input.date,
        comment: (input.comment || '').trim()
    };
}

export function isValidDateOnly(value) {
    if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

export function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

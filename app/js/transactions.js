// Модуль операций над транзакциями: создание, валидация, удаление, генерация id.

export const CATEGORIES = ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Здоровье', 'Другие'];
export const TYPES = ['income', 'expense'];

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
        type: input.type,
        amount: roundMoney(Number(input.amount)),
        category: input.category,
        date: normalizeDate(input.date),
        comment: (input.comment || '').trim()
    };
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
    if (!CATEGORIES.includes(input.category)) {
        errors.push('Не выбрана категория');
    }
    if (!input.date || Number.isNaN(Date.parse(input.date))) {
        errors.push('Не указана корректная дата');
    }
    if (input.comment && typeof input.comment === 'string' && input.comment.length > 120) {
        errors.push('Комментарий не может быть длиннее 120 символов');
    }
    return errors;
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

function normalizeDate(value) {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

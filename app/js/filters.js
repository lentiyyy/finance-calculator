// Модуль фильтрации транзакций по периоду, типу, категории и поисковому запросу.

export function applyFilters(transactions, filters) {
    const { period, dateFrom, dateTo, type, category, search } = filters;
    const range = resolvePeriod(period, dateFrom, dateTo);
    const needle = (search || '').trim().toLowerCase();

    return transactions.filter(t => {
        if (range && !inRange(t.date, range.from, range.to)) return false;
        if (type && type !== 'all' && t.type !== type) return false;
        if (category && category !== 'all' && t.category !== category) return false;
        if (needle && !t.comment.toLowerCase().includes(needle)) return false;
        return true;
    });
}

function resolvePeriod(period, dateFrom, dateTo) {
    const now = new Date();
    if (period === 'week') {
        const dayOfWeek = (now.getDay() + 6) % 7; // понедельник = 0
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek);
        return { from: toDateOnly(monday), to: toDateOnly(now) };
    }
    if (period === 'month') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: toDateOnly(first), to: toDateOnly(now) };
    }
    if (period === 'custom') {
        if (!dateFrom && !dateTo) return null;
        return {
            from: dateFrom ? dateFrom : '0000-01-01',
            to: dateTo ? dateTo : '9999-12-31'
        };
    }
    return null;
}

function inRange(date, from, to) {
    return date >= from && date <= to;
}

function toDateOnly(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

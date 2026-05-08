// Модуль агрегации статистики: итоги, баланс, распределение по категориям, текстовый график.

const BAR_WIDTH = 20;

export function calculateStats(transactions) {
    const totalIncome = sumByType(transactions, 'income');
    const totalExpense = sumByType(transactions, 'expense');
    const balance = totalIncome - totalExpense;
    const expenseByCategory = groupByCategory(transactions, 'expense');
    const incomeByCategory = groupByCategory(transactions, 'income');

    return {
        totalIncome,
        totalExpense,
        balance,
        expenseByCategory: withPercents(expenseByCategory, totalExpense),
        incomeByCategory: withPercents(incomeByCategory, totalIncome)
    };
}

export function buildBar(percent, width = BAR_WIDTH) {
    const filled = Math.round((percent / 100) * width);
    const safe = Math.max(0, Math.min(width, filled));
    return '#'.repeat(safe) + '·'.repeat(width - safe);
}

function sumByType(transactions, type) {
    return transactions
        .filter(t => t.type === type)
        .reduce((acc, t) => acc + t.amount, 0);
}

function groupByCategory(transactions, type) {
    const map = new Map();
    for (const t of transactions) {
        if (t.type !== type) continue;
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
}

function withPercents(items, total) {
    if (total <= 0) return [];
    return items
        .map(item => ({
            ...item,
            percent: (item.amount / total) * 100
        }))
        .sort((a, b) => b.amount - a.amount);
}

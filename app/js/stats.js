// Модуль агрегации статистики: итоги, баланс, распределение по категориям.

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

export function calculateBudgetStatus(expenseByCategory, budgets) {
    const expenseMap = new Map(expenseByCategory.map(item => [item.category, item.amount]));
    return Object.entries(budgets)
        .filter(([, limit]) => Number.isFinite(limit) && limit > 0)
        .map(([category, limit]) => {
            const spent = expenseMap.get(category) || 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            return {
                category,
                limit,
                spent,
                left: limit - spent,
                percent
            };
        })
        .sort((a, b) => b.percent - a.percent);
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

// Экспорт транзакций в CSV для резервной копии и анализа в таблицах.

const CSV_HEADERS = ['Дата', 'Тип', 'Категория', 'Сумма', 'Комментарий'];

export function buildCsv(transactions) {
    const rows = transactions.map(transaction => [
        transaction.date,
        transaction.type === 'income' ? 'Доход' : 'Расход',
        transaction.category,
        transaction.amount.toFixed(2),
        transaction.comment || ''
    ]);

    return [CSV_HEADERS, ...rows]
        .map(row => row.map(escapeCsvCell).join(';'))
        .join('\n');
}

export function downloadCsv(transactions) {
    const csv = buildCsv(transactions);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
    const text = String(value ?? '');
    if (!/[;"\n\r]/.test(text)) return text;
    return `"${text.replaceAll('"', '""')}"`;
}

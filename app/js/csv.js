// Экспорт списка транзакций в CSV-файл (UTF-8 BOM, разделитель — точка с запятой).

const HEADERS = ['Дата', 'Тип', 'Категория', 'Сумма', 'Комментарий'];

export function exportTransactionsToCsv(transactions, filename = 'transactions.csv') {
    const lines = [HEADERS.join(';')];
    for (const t of transactions) {
        lines.push([
            t.date,
            t.type === 'income' ? 'Доход' : 'Расход',
            csvEscape(t.category),
            t.amount.toFixed(2).replace('.', ','),
            csvEscape(t.comment || '')
        ].join(';'));
    }
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, filename);
}

function csvEscape(value) {
    const str = String(value);
    if (/[;"\n\r]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

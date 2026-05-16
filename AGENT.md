# AGENT.md

## Project Snapshot

Project: coursework web app "Калькулятор личных финансов".

Workspace path:
`/Users/lentiyyy/Desktop/1 folder/finance-calculator-main/finance-calculator-main`

Git remote:
`git@github.com:lentiyyy/finance-calculator.git`

Main branch:
`main`

The app is a static browser application using plain HTML, CSS and JavaScript ES modules. It is intended for a Russian coursework project for МДК.02.02 "Инструментальные средства разработки".

## How To Run

From the project root:

```bash
cd app
python3 -m http.server 8001
```

Open:
`http://localhost:8001`

Because the app uses ES modules, it should be served over local HTTP rather than opened directly as a file.

## Tests

From the project root:

```bash
npm test
```

Current test suite uses Node's built-in test runner. At the time this file was created, all 10 tests passed.

Test files:
- `tests/core.test.js`
- `tests/storage.test.js`
- `tests/transactions.test.js`

## App Structure

- `app/index.html` - main page markup.
- `app/styles.css` - all styling and responsive layout.
- `app/js/app.js` - entry point, state, event binding and coordination.
- `app/js/storage.js` - `localStorage` load/save for transactions and budgets.
- `app/js/transactions.js` - transaction creation, validation, editing helpers, categories and date helpers.
- `app/js/filters.js` - period/type/category/comment filtering.
- `app/js/stats.js` - totals, balance, category analytics and budget status calculations.
- `app/js/ui.js` - DOM rendering and formatting.
- `app/js/export.js` - CSV generation and download.

## Current Features

Implemented:
- Add income/expense transactions.
- Edit existing transactions.
- Delete one transaction.
- Clear all transactions with confirmation.
- Store transactions in `localStorage`.
- Store expense budgets in `localStorage`.
- Filter by period, custom date range, type, category and comment search.
- Summary cards for income, expense and balance.
- Expense analytics by category with rubles, percentage and text bar made from `#`.
- Budgets by expense category with remaining/over-limit state.
- Export current visible transaction list to CSV.
- Load demo data manually by button.
- Strict date validation: impossible dates and future dates are rejected.
- Basic responsive layout.

Important behavior:
- Empty `localStorage` now opens as an empty app.
- Demo data is no longer auto-created; it only loads after clicking "Загрузить демо-данные".
- Demo data is generated only up to the current date, not future dates.

## Storage Keys

- `finance-calc:transactions:v1`
- `finance-calc:budgets:v1`

Transaction shape:

```js
{
  id: string,
  type: 'income' | 'expense',
  amount: number,
  category: string,
  date: 'YYYY-MM-DD',
  comment: string
}
```

## Documentation And Reports

Project docs:
- `README.md`
- `docs(pdf)/theory_report.docx`
- `docs(pdf)/theory_report.pdf`
- `docs(pdf)/practice_report.docx`
- `docs(pdf)/practice_report.pdf`
- `docs/максим леонтьев.docx` came from the existing remote repo history and was preserved during merge.

Reports were updated to match the app after the feature work. PDF files were regenerated via Microsoft Word because `soffice`/LibreOffice was unavailable on this machine.

## Recent Work Completed

The project was analyzed against attached coursework requirements. Then the following improvements were made:
- Added edit transaction flow.
- Added CSV export through `app/js/export.js`.
- Added manual demo-data loading.
- Added clear-all-data action.
- Added expense budgets.
- Strengthened validation and stored-data filtering.
- Added automated tests and `package.json`.
- Updated README and coursework reports.
- Initialized git repository locally, merged with existing remote `main`, removed old unused `app/js/csv.js`, and pushed to GitHub.

Current pushed branch state includes merge with remote history. Last known pushed commit:
`9811370 Remove unused legacy CSV helper`

## Development Notes

- Prefer keeping the app dependency-free for the coursework requirement.
- Use existing module boundaries instead of adding a framework.
- If adding app logic, add tests where possible.
- Keep Russian UI text consistent and coursework-friendly.
- Be careful with future dates: the current business rule is "transaction date cannot be later than today".
- If modifying DOCX reports, remember LibreOffice rendering may fail here because `soffice` is missing. Microsoft Word export via AppleScript worked for PDF regeneration.
- The in-app browser was used to verify `http://localhost:8001`.

## Useful Commands

```bash
# Run tests
npm test

# Start local app server
cd app && python3 -m http.server 8001

# Check git status
git status --short --branch

# Push main
git push origin main
```

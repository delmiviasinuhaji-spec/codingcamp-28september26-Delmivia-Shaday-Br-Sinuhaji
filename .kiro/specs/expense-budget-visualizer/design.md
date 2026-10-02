# Design — Expense & Budget Visualizer

## Architecture Overview

The application is a zero-dependency, single-page web app. There is no build step, no module bundler, and no server. The entire runtime lives in three files:

```
index.html          ← markup & DOM skeleton
css/style.css       ← all styling, design tokens, responsive layout
js/app.js           ← all logic, state, rendering, persistence
```

Chart.js 4.4.0 is loaded from jsDelivr CDN via a `<script>` tag in `<head>`.

---

## File Responsibilities

### `index.html`
- Declares the `data-theme` attribute on `<html>` (default `"light"`).
- Loads `css/style.css` and the Chart.js CDN script in `<head>`.
- Provides the static DOM skeleton: header, balance card, two-panel grid, form, category manager, chart canvas, and transaction list.
- Category `<select>` options and transaction list items are **not** in the HTML — they are injected entirely by JavaScript.
- Loads `js/app.js` at the bottom of `<body>` so the DOM is ready.

### `css/style.css`
Structured in named sections:
1. **Design tokens** — all colors, shadows, radii, font stack, and transition duration as CSS custom properties on `:root` (light theme) and `[data-theme="dark"]` (dark override).
2. **Reset & base** — box-sizing, margin/padding reset, `scroll-behavior: smooth`.
3. **Layout** — sticky header, max-width container, balance card, CSS Grid two-column layout (single column < 768 px).
4. **Components** — card, form groups, inputs, buttons, category chips, chart wrapper, transaction list items.
5. **Animations** — `fadeSlideIn` keyframe for new transaction items.
6. **Responsive tweaks** — `@media (max-width: 480px)` overrides for very small screens.

### `js/app.js`
Structured in named sections:
1. **Constants & state** — storage keys, built-in category definitions, color palette array, mutable `state` object, `chartInstance` reference.
2. **Init** — `init()` entry point called on `DOMContentLoaded`.
3. **Local Storage** — `loadFromStorage()`, `saveTransactions()`, `saveCustomCategories()`.
4. **Theme** — `applyTheme()`, `toggleTheme()`.
5. **Categories** — `getCategoryById()`, `renderCategoryOptions()`, `renderCategoryChips()`, `addCategory()`, `deleteCategory()`.
6. **Transactions** — `handleFormSubmit()`, `deleteTransaction()`, `getSortedTransactions()`, `renderTransactions()`.
7. **Balance** — `updateBalance()`.
8. **Chart** — `renderChart()`.
9. **Event binding** — `bindEvents()` wires all DOM listeners once.
10. **Helpers** — `showFieldError()`, `clearFormErrors()`, `escapeHTML()`, `hexWithAlpha()`.

---

## State Model

A single `state` object is the source of truth for all runtime data:

```js
state = {
  transactions: [],   // Array<Transaction>
  categories: [],     // Array<Category>  (built-ins first, then custom)
  theme: 'light',     // 'light' | 'dark'
  sort: 'date-desc',  // SortKey
}
```

**Transaction shape:**
```js
{
  id: 'tx_<timestamp>',   // string — unique identifier
  name: string,           // user-supplied item name (HTML-escaped on render)
  amount: number,         // positive float
  categoryId: string,     // references a Category.id
  createdAt: number,      // Unix timestamp ms — used for date sorting
}
```

**Category shape:**
```js
{
  id: string,         // 'food' | 'transport' | 'fun' | 'cat_<timestamp>'
  label: string,      // display name
  emoji: string,      // single emoji character
  color: string,      // hex color string e.g. '#f59e0b'
  isBuiltIn: boolean, // true for the three default categories
}
```

State is never written to the DOM directly — all rendering functions read from `state` and produce HTML/DOM output.

---

## Data Flow

```
User action
    │
    ▼
Event listener (bindEvents)
    │
    ▼
Mutation function
  (addCategory / deleteCategory /
   handleFormSubmit / deleteTransaction /
   toggleTheme / sort change)
    │
    ├─► Update state object
    ├─► Persist to Local Storage
    └─► Call render functions:
          renderTransactions()
          renderChart()
          updateBalance()
          renderCategoryOptions()    (on category changes)
          renderCategoryChips()      (on category changes)
          applyTheme()               (on theme change)
```

Render functions are **pure read operations** on `state` — they never modify it. This makes every render call idempotent and safe to call in any combination.

---

## UI Layout

### Desktop (≥ 768 px)
```
┌─────────────────────────────────────────────────┐
│  💰 Budget Tracker                          🌙   │  ← sticky header
├─────────────────────────────────────────────────┤
│              Total Spent: $0.00                  │  ← balance card (gradient)
├──────────────────┬──────────────────────────────┤
│  Add Transaction │  Spending by Category         │
│  ─────────────── │  [Pie Chart]                  │
│  Item Name       │                               │
│  Amount          ├──────────────────────────────┤
│  Category ▼      │  Transactions  Sort by: ▼     │
│  + Add           │  ┌────────────────────────┐   │
│                  │  │ 🍔 Coffee    Food  $4.50│   │
│  Manage          │  │ 🚌 Bus       Trans $2.00│   │
│  Categories      │  │ …                      │   │
│  [input] [Add]   │  └────────────────────────┘   │
│  🍔Food 🚌Trans  │                               │
│  🎉Fun  📌Custom │                               │
└──────────────────┴──────────────────────────────┘
```

### Mobile (< 768 px)
All panels stack vertically in source order: header → balance → add form → category manager → chart → transaction list.

---

## Component Details

### Balance Card
- Full-width card with an indigo-to-violet CSS gradient background.
- Label "TOTAL SPENT" in small uppercase, balance amount in 2.75 rem bold.
- On mobile the font shrinks to 2.1 rem.

### Add Transaction Form
- Three labeled fields with inline `<span class="field-error">` elements beneath each.
- Validation runs client-side in `handleFormSubmit` before any state mutation.
- Error borders use CSS class `input-error`; the class is removed on the field's next `input` event.
- The category `<select>` is fully populated by `renderCategoryOptions()` on init and after category changes.

### Category Manager
- Text input + "Add" button in a flex row; Enter key triggers add.
- All categories rendered as pill chips via `renderCategoryChips()`.
- Built-in chips have `.chip-builtin` which hides the delete button via CSS (`display: none`).
- Deleting a custom category calls `deleteCategory(id)` which reassigns affected transactions to `'food'` before removing the category.

### Pie Chart
- Rendered on a `<canvas id="spendingChart">` element.
- `renderChart()` creates the Chart.js instance on first call (after transactions exist) and mutates its data on subsequent calls to avoid full redraws.
- When `chartInstance` is destroyed (no data), it is set back to `null` so the next call recreates it cleanly.
- Legend text color is set based on `state.theme` at creation time; theme toggles destroy and recreate the chart to pick up the new color.
- Tooltip callback computes percentage from the dataset total.

### Transaction List
- `<ul>` with `aria-live="polite"` for screen-reader announcements.
- Max height 420 px, `overflow-y: auto`, thin custom scrollbar.
- Items built with `renderTransactions()` using `getSortedTransactions()` — the underlying `state.transactions` array is never reordered.
- Delete button uses event delegation on the `<ul>` (single listener, not per-item).

### Theme Toggle
- Button in the header with a single emoji child (`🌙` / `☀️`).
- `applyTheme(theme)` sets `document.documentElement.setAttribute('data-theme', theme)` — CSS variables do the rest.

---

## Styling System

All colors are CSS custom properties defined in `:root` (light) and `[data-theme="dark"]`. No color values appear in JavaScript except those stored in category objects (used as Chart.js dataset colors and inline `background` styles on badges).

Category badge backgrounds use `hexWithAlpha(color, 0.15)` — a JS helper that converts a hex color to an `rgba()` string — applied as an inline style so the badge tint matches the category color dynamically.

The 12-color custom-category palette is defined in `COLOR_PALETTE` in `app.js` and cycles using a modulo of the current custom category count.

---

## Security

User-supplied strings (`tx.name`, `cat.label`) are never inserted with `innerHTML` directly. All such values pass through `escapeHTML()`, which creates a temporary `<div>`, appends a text node, and returns `div.innerHTML` — a browser-native HTML-escaping approach with no regex.

---

## External Dependencies

| Dependency | Source | Version | Purpose |
|---|---|---|---|
| Chart.js | jsDelivr CDN | 4.4.0 | Pie chart rendering |

No npm packages, no build tools, no polyfills.

---

## Browser Compatibility

The app uses only broadly-supported features:
- CSS Grid, CSS Custom Properties, `data-*` attributes
- `localStorage`, `JSON.parse/stringify`
- `Array.prototype` methods (spread, map, filter, find, sort, reduce)
- `document.createElement`, `addEventListener`, event delegation
- `DOMContentLoaded` bootstrap

All of the above have full support in Chrome, Firefox, Edge, and Safari (modern versions).

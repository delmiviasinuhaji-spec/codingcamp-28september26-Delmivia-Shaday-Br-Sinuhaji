# Tasks — Expense & Budget Visualizer

> Status key: ✅ Complete · 🔲 Not started

All tasks below are **already implemented**. This document records what was built and maps each implementation unit to its requirements.

---

## Task 1 — Project Scaffold ✅

Set up the folder structure and static entry point.

- [x] Create `css/` directory
- [x] Create `js/` directory
- [x] Create `index.html` with `<!DOCTYPE html>`, UTF-8 charset, viewport meta tag, and `data-theme="light"` on `<html>`
- [x] Link `css/style.css` in `<head>`
- [x] Load Chart.js 4.4.0 from jsDelivr CDN in `<head>`
- [x] Load `js/app.js` at the bottom of `<body>`

**Files:** `index.html`
**Covers:** NFR-4, NFR-5

---

## Task 2 — HTML Structure ✅

Build the full DOM skeleton that JavaScript reads and populates.

- [x] Sticky `<header>` with app title and `#themeToggle` button containing `#themeIcon` span
- [x] Balance card section with `#totalBalance` paragraph
- [x] CSS Grid `.main-grid` wrapper with `.left-panel` and `.right-panel`
- [x] Add Transaction `<form id="transactionForm">` with fields `#itemName`, `#itemAmount`, `#itemCategory` and inline error spans `#nameError`, `#amountError`, `#categoryError`
- [x] Manage Categories section with `#newCategoryInput`, `#addCategoryBtn`, `#categoryAddError`, and `#categoryChips` container
- [x] Chart card with `<canvas id="spendingChart">` and `#chartEmpty` placeholder paragraph
- [x] Transaction list `<ul id="transactionList" aria-live="polite">` with `#listEmpty` placeholder and `#sortSelect` dropdown

**Files:** `index.html`
**Covers:** REQ-1.1, REQ-2.1, REQ-3.1, REQ-4.1, REQ-6.1, REQ-7.1

---

## Task 3 — CSS Design System ✅

Define all visual tokens and component styles.

- [x] CSS custom properties on `:root` for the full light-theme palette (background, surface, border, text, primary, danger, balance gradient, chip colors, shadows, radii, font stack, transition duration)
- [x] `[data-theme="dark"]` block overriding every color variable for the dark theme
- [x] Box-sizing reset and base body styles
- [x] Sticky header and `.header-inner` flex layout
- [x] `.balance-card` with gradient background and large amount typography
- [x] CSS Grid `.main-grid`: single column default, two-column (340 px + 1fr) at ≥ 768 px
- [x] `.card` component with border, shadow, and border-radius
- [x] Form group, label, input, number input, and select base styles with focus and error states
- [x] Custom SVG dropdown arrow for `<select>` elements
- [x] Button variants: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-icon`, `.btn-full`
- [x] Category chip `.chip` and `.chip-builtin` (hides delete button)
- [x] Chart wrapper min-height and canvas max-height
- [x] Transaction list scrollable container with thin custom scrollbar
- [x] `.transaction-item` flex layout with hover state and `fadeSlideIn` animation keyframe
- [x] `@media (max-width: 480px)` tweaks for very small screens

**Files:** `css/style.css`
**Covers:** NFR-1, NFR-2, NFR-6, NFR-7, REQ-2.5, REQ-8.2

---

## Task 4 — State & Local Storage ✅

Define application state and implement all persistence functions.

- [x] Define four `STORAGE_KEY_*` constants
- [x] Define `BUILT_IN_CATEGORIES` array with Food, Transport, Fun entries (id, label, emoji, hex color)
- [x] Define 12-color `COLOR_PALETTE` array for custom category auto-assignment
- [x] Define mutable `state` object: `{ transactions, categories, theme, sort }`
- [x] `loadFromStorage()` — reads all four keys, merges built-ins with custom categories, restores sort select value
- [x] `saveTransactions()` — serialises `state.transactions` to `STORAGE_KEY_TRANSACTIONS`
- [x] `saveCustomCategories()` — filters to non-built-in categories and serialises to `STORAGE_KEY_CATEGORIES`

**Files:** `js/app.js`
**Covers:** REQ-5.1 – REQ-5.5

---

## Task 5 — Theme System ✅

Implement dark/light mode toggle with persistence.

- [x] `applyTheme(theme)` — sets `data-theme` attribute on `<html>`, updates `#themeIcon` emoji
- [x] `toggleTheme()` — flips `state.theme`, saves to Local Storage, calls `applyTheme()`, triggers `renderChart()` for legend color update
- [x] Bind `#themeToggle` click in `bindEvents()`

**Files:** `js/app.js`
**Covers:** REQ-8.1 – REQ-8.4

---

## Task 6 — Category Management ✅

Implement built-in and custom category CRUD.

- [x] `getCategoryById(id)` — returns matching category from `state.categories` or `null`
- [x] `renderCategoryOptions()` — clears and repopulates `#itemCategory` `<select>` from `state.categories`
- [x] `renderCategoryChips()` — renders all categories as chips in `#categoryChips`, adding `.chip-builtin` for non-deletable ones
- [x] `addCategory(label)` — trims input, validates non-empty and non-duplicate (case-insensitive), assigns next palette color, pushes to `state.categories`, saves, re-renders options and chips; returns `{ ok, error }`
- [x] `deleteCategory(id)` — guards against built-in deletion, reassigns orphaned transactions to `'food'`, removes from state, saves both transactions and categories, re-renders everything
- [x] Bind `#addCategoryBtn` click and `#newCategoryInput` Enter keydown in `bindEvents()`
- [x] Bind chip delete via event delegation on `#categoryChips` in `bindEvents()`

**Files:** `js/app.js`
**Covers:** REQ-6.1 – REQ-6.8

---

## Task 7 — Transaction Form & Validation ✅

Implement add-transaction flow with client-side validation.

- [x] `handleFormSubmit(e)` — prevents default, clears prior errors, reads and trims field values
- [x] Validate Item Name: empty check → show error on `#nameError`, add `.input-error` to field
- [x] Validate Amount: empty / NaN / ≤ 0 check → show error on `#amountError`
- [x] Validate Category: falsy check → show error on `#categoryError`
- [x] On success: construct transaction object `{ id, name, amount, categoryId, createdAt }`, push to `state.transactions`, call `saveTransactions()`, call `renderTransactions()`, `renderChart()`, `updateBalance()`, reset form, focus `#itemName`
- [x] `clearFormErrors()` — clears all three error spans and removes `.input-error` class
- [x] Bind `input` events on each field to remove `.input-error` class immediately on user correction

**Files:** `js/app.js`
**Covers:** REQ-1.1 – REQ-1.5

---

## Task 8 — Transaction List Rendering & Delete ✅

Implement list display, deletion, and sort.

- [x] `getSortedTransactions()` — returns a shallow copy of `state.transactions` sorted by the current `state.sort` key (6 cases: date-desc, date-asc, amount-desc, amount-asc, category-asc, category-desc)
- [x] `renderTransactions()` — clears `#transactionList`, shows/hides `#listEmpty`, builds each `<li>` with badge (emoji + `hexWithAlpha` background), name, category label, amount, and delete button; uses `escapeHTML` on all user strings
- [x] `deleteTransaction(id)` — filters `state.transactions`, saves, re-renders list + chart + balance
- [x] Bind delete via event delegation (`.delete-btn`) on `#transactionList` in `bindEvents()`
- [x] Bind `#sortSelect` change to update `state.sort`, save to Local Storage, and call `renderTransactions()`

**Files:** `js/app.js`
**Covers:** REQ-2.1 – REQ-2.5, REQ-7.1 – REQ-7.3

---

## Task 9 — Balance Display ✅

Implement the live total balance.

- [x] `updateBalance()` — sums `tx.amount` across all transactions with `Array.reduce`, formats as `$X.XX`, writes to `#totalBalance`
- [x] `updateBalance()` called from: `init()`, `handleFormSubmit()`, `deleteTransaction()`, `deleteCategory()`

**Files:** `js/app.js`
**Covers:** REQ-3.1 – REQ-3.3

---

## Task 10 — Pie Chart ✅

Implement Chart.js pie chart with live updates.

- [x] `renderChart()` — aggregates `tx.amount` per `categoryId` into a `totals` map
- [x] Filters `state.categories` to only those with spend > 0
- [x] When no data: hide canvas, show `#chartEmpty`, destroy existing `chartInstance` and null it
- [x] When data exists: show canvas, hide `#chartEmpty`
- [x] If `chartInstance` exists: mutate `.data.labels`, `.data.datasets[0].data`, `.data.datasets[0].backgroundColor`, `.data.datasets[0].borderColor`, call `.update()` — no full redraw
- [x] If `chartInstance` is null: create new `Chart` with type `'pie'`, responsive options, bottom legend with theme-aware text color, and tooltip callback showing `$X.XX (Y%)`
- [x] `hexWithAlpha(hex, alpha)` helper converts hex color strings to `rgba()` for border colors and badge backgrounds

**Files:** `js/app.js`
**Covers:** REQ-4.1 – REQ-4.6

---

## Task 11 — Security Helpers ✅

Ensure all user input is safely rendered.

- [x] `escapeHTML(str)` — creates a temporary `<div>`, appends a text node of `String(str)`, returns `div.innerHTML`; used for `tx.name` and `cat.label` in `renderTransactions()`

**Files:** `js/app.js`
**Covers:** NFR-3

---

## Task 12 — Initialisation & Event Wiring ✅

Bootstrap the app and connect all event listeners.

- [x] `init()` — calls `loadFromStorage`, `applyTheme`, `renderCategoryOptions`, `renderCategoryChips`, `renderTransactions`, `renderChart`, `updateBalance`, `bindEvents` in order
- [x] `bindEvents()` — registers all listeners in one place: form submit, list click delegation, sort change, theme toggle, category add button, category input Enter, category chips click delegation, per-field input error clear
- [x] `document.addEventListener('DOMContentLoaded', init)` bootstrap

**Files:** `js/app.js`
**Covers:** All REQ and NFR items (bootstrap correctness)

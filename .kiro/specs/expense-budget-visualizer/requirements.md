# Requirements — Expense & Budget Visualizer

## Overview

A mobile-friendly, single-page web application that helps users track their daily spending. It runs entirely in the browser with no backend, persists data in Local Storage, and visualizes spending by category with a live pie chart.

---

## Functional Requirements

### 1. Add Transaction Form

**REQ-1.1** The form MUST contain three fields:
- **Item Name** — free-text input, max 60 characters.
- **Amount** — numeric input accepting decimal values, minimum value 0.01.
- **Category** — dropdown `<select>` populated from the current category list.

**REQ-1.2** Submitting the form with any field empty or invalid MUST display an inline error message beneath the offending field and MUST NOT add the transaction.

**REQ-1.3** Amount validation MUST reject values ≤ 0 and non-numeric input.

**REQ-1.4** On successful submission the form MUST reset to its empty state and focus the Item Name field.

**REQ-1.5** Each new transaction is stored as an object: `{ id, name, amount, categoryId, createdAt }` where `id` is a unique string prefixed `tx_` and `createdAt` is a Unix timestamp (ms).

---

### 2. Transaction List

**REQ-2.1** All saved transactions MUST be displayed in a scrollable list.

**REQ-2.2** Each list item MUST show:
- A color-coded emoji badge derived from the item's category.
- The item name (truncated with ellipsis if overflowing).
- The category label in smaller muted text.
- The amount formatted as `$X.XX` in the primary accent color.
- A delete (✕) button.

**REQ-2.3** Clicking the delete button MUST immediately remove that transaction from state, Local Storage, the list, the balance, and the chart.

**REQ-2.4** When no transactions exist the list MUST display the placeholder message "No transactions yet." and hide the `<ul>`.

**REQ-2.5** New items MUST animate in with a fade-slide-in effect (opacity 0→1, translateY −6px→0, 220 ms).

---

### 3. Total Balance

**REQ-3.1** A prominent balance card at the top of the page MUST display the sum of all transaction amounts as `$X.XX`.

**REQ-3.2** The balance MUST recalculate and re-render immediately whenever a transaction is added or deleted — no page refresh required.

**REQ-3.3** The initial balance on page load MUST reflect data already in Local Storage.

---

### 4. Spending Pie Chart

**REQ-4.1** A Chart.js 4.x pie chart MUST be rendered showing total spend per category for all current transactions.

**REQ-4.2** Each category slice MUST use the color assigned to that category (built-in or custom).

**REQ-4.3** The chart MUST update in place (data mutation, not full redraw) whenever transactions are added or deleted, and after category deletions.

**REQ-4.4** When no transactions exist the canvas MUST be hidden and the placeholder "No data yet. Add a transaction!" MUST be shown instead.

**REQ-4.5** Chart tooltips MUST show the dollar amount and percentage of total for the hovered slice, formatted as `$X.XX (Y%)`.

**REQ-4.6** The chart legend MUST appear below the pie, using point-style markers.

---

### 5. Local Storage Persistence

**REQ-5.1** All transactions MUST be saved to Local Storage under the key `budget_tracker_transactions` as a JSON array.

**REQ-5.2** Custom categories MUST be saved under the key `budget_tracker_categories` as a JSON array (built-in categories are never written to storage).

**REQ-5.3** The active theme (`light` or `dark`) MUST be saved under `budget_tracker_theme`.

**REQ-5.4** The active sort preference MUST be saved under `budget_tracker_sort`.

**REQ-5.5** On page load, all four keys MUST be read and state restored before any rendering occurs.

---

### 6. Custom Categories (Optional Feature — Implemented)

**REQ-6.1** Three categories MUST be built in and non-deletable: **Food** (🍔, amber), **Transport** (🚌, blue), **Fun** (🎉, pink).

**REQ-6.2** A "Manage Categories" panel MUST provide a text input and an "Add" button to create custom categories.

**REQ-6.3** Pressing **Enter** in the category name input MUST trigger the same action as clicking "Add".

**REQ-6.4** Custom category names MUST be trimmed; empty names and names that duplicate an existing category (case-insensitive) MUST be rejected with an inline error message.

**REQ-6.5** Each new custom category MUST be assigned the 📌 emoji and a color auto-selected from a 12-color palette, cycling when all colors have been used.

**REQ-6.6** All categories (built-in and custom) MUST be displayed as chips in the category manager. Built-in chips MUST NOT show a delete button.

**REQ-6.7** Deleting a custom category MUST reassign all its transactions to the built-in "Food" category before removing the category from state and storage.

**REQ-6.8** Custom categories MUST appear in the transaction form's category dropdown immediately after being added.

---

### 7. Sort Transactions (Optional Feature — Implemented)

**REQ-7.1** A sort dropdown in the transaction list header MUST offer six options:
| Value | Label |
|---|---|
| `date-desc` | Latest first (default) |
| `date-asc` | Oldest first |
| `amount-desc` | Amount (High→Low) |
| `amount-asc` | Amount (Low→High) |
| `category-asc` | Category (A→Z) |
| `category-desc` | Category (Z→A) |

**REQ-7.2** Changing the sort selection MUST re-render the list immediately without modifying the underlying data array.

**REQ-7.3** The active sort preference MUST persist across page reloads via Local Storage.

---

### 8. Dark / Light Mode Toggle (Optional Feature — Implemented)

**REQ-8.1** A toggle button (🌙 / ☀️) in the sticky header MUST switch between light and dark themes.

**REQ-8.2** The active theme MUST be applied by setting `data-theme="light"` or `data-theme="dark"` on the `<html>` element; all colors MUST use CSS custom properties so the entire UI transitions without JS DOM manipulation beyond that one attribute.

**REQ-8.3** Theme preference MUST persist in Local Storage and be restored on page load before first render.

**REQ-8.4** Switching theme MUST trigger a chart redraw so legend text color updates to match the new theme.

---

## Non-Functional Requirements

**NFR-1** The application MUST work correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari with no polyfills required.

**NFR-2** The layout MUST be responsive: single-column on screens narrower than 768 px, two-column (340 px left panel + flexible right panel) on screens 768 px and wider.

**NFR-3** All user-supplied strings written to the DOM MUST pass through an HTML-escaping helper (`escapeHTML`) to prevent XSS.

**NFR-4** No backend, server, build tool, or JavaScript framework is permitted. The app MUST run by opening `index.html` directly in a browser.

**NFR-5** There MUST be exactly one CSS file (`css/style.css`) and exactly one JavaScript file (`js/app.js`). Chart.js is loaded from a CDN.

**NFR-6** The interface MUST be clean and minimal with a clear visual hierarchy. Interactive states (focus, hover, active) MUST be visually distinct.

**NFR-7** Theme transitions MUST be smooth (0.2 s ease) and MUST NOT cause layout shifts.

# Data table

A list page: title and main action, search, a status filter, a selectable table, pagination, and loading and empty states.

## When to use
Any collection people search, filter and act on in bulk: customers, orders, files. For a handful of items use the Item list from the profile kit instead.

## What to replace
- The `customers` sample data and the columns.
- The search, filter and pagination handlers: the story filters in the page; real data usually filters on the server.
- The empty state text and its action.

## How to adapt
- Keep the caption: it names the table.
- Give every row checkbox a label that names the row ("Select …"), even though it is hidden.
- While loading, keep the table and its header, swap the rows for skeletons and set `aria-busy="true"` on the table.
- When there is nothing to show, replace the table and the pagination with the empty state; keep the search and filter if a filter caused it.
- The `/` shortcut is optional; if you keep it, keep the visible hint and keep its listener on the page's `main`, so it works only while focus is inside the page and never fires from elsewhere (WCAG 2.1.4).
- When a filter changes the rows, update the `role="status"` line with the new count ("Showing 2 of 6 customers"), so screen readers announce the result without moving focus (WCAG 4.1.3). Keep that line in the page from the start: a status region added together with its text is not announced.

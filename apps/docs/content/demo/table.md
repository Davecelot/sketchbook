---
title: "Table"
description: "Rows and columns of data. Custom elements take ARIA table roles and CSS table display, so the markup stays flexible and the semantics stay those of a table."
---

<!-- Generated from spec/components/table/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-table>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-table style="width:560px">
  <sb-table-caption>Recent orders</sb-table-caption>
  <sb-table-header>
    <sb-table-row>
      <sb-table-head>Order</sb-table-head>
      <sb-table-head>Status</sb-table-head>
      <sb-table-head style="text-align:end">Amount</sb-table-head>
    </sb-table-row>
  </sb-table-header>
  <sb-table-body>
    <sb-table-row><sb-table-cell>ORD-1001</sb-table-cell><sb-table-cell>Paid</sb-table-cell><sb-table-cell style="text-align:end">$250.00</sb-table-cell></sb-table-row>
    <sb-table-row><sb-table-cell>ORD-1002</sb-table-cell><sb-table-cell>Pending</sb-table-cell><sb-table-cell style="text-align:end">$150.00</sb-table-cell></sb-table-row>
    <sb-table-row><sb-table-cell>ORD-1003</sb-table-cell><sb-table-cell>Paid</sb-table-cell><sb-table-cell style="text-align:end">$350.00</sb-table-cell></sb-table-row>
  </sb-table-body>
  <sb-table-footer>
    <sb-table-row><sb-table-cell>Total</sb-table-cell><sb-table-cell></sb-table-cell><sb-table-cell style="text-align:end">$750.00</sb-table-cell></sb-table-row>
  </sb-table-footer>
</sb-table>
</div>

```html
<sb-table style="width:560px">
  <sb-table-caption>Recent orders</sb-table-caption>
  <sb-table-header>
    <sb-table-row>
      <sb-table-head>Order</sb-table-head>
      <sb-table-head>Status</sb-table-head>
      <sb-table-head style="text-align:end">Amount</sb-table-head>
    </sb-table-row>
  </sb-table-header>
  <sb-table-body>
    <sb-table-row><sb-table-cell>ORD-1001</sb-table-cell><sb-table-cell>Paid</sb-table-cell><sb-table-cell style="text-align:end">$250.00</sb-table-cell></sb-table-row>
    <sb-table-row><sb-table-cell>ORD-1002</sb-table-cell><sb-table-cell>Pending</sb-table-cell><sb-table-cell style="text-align:end">$150.00</sb-table-cell></sb-table-row>
    <sb-table-row><sb-table-cell>ORD-1003</sb-table-cell><sb-table-cell>Paid</sb-table-cell><sb-table-cell style="text-align:end">$350.00</sb-table-cell></sb-table-row>
  </sb-table-body>
  <sb-table-footer>
    <sb-table-row><sb-table-cell>Total</sb-table-cell><sb-table-cell></sb-table-cell><sb-table-cell style="text-align:end">$750.00</sb-table-cell></sb-table-row>
  </sb-table-footer>
</sb-table>
```

## Properties



## Parts

### `<sb-table-row>`

One row, with a bottom border and hover and selected fills.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `selected` | boolean | `false` | Selected fill and aria-selected=true. |

## Accessibility

- Role: `table`
- Accessible name: A sb-table-caption child, else aria-label or aria-labelledby on sb-table.

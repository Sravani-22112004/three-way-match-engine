# Examples

This folder contains sample inputs and outputs for the Three-Way Match Engine.

## Parsed Document Examples

These show what Gemini extracts and what gets stored in MongoDB after a successful upload.

| File | Endpoint | Description |
|---|---|---|
| `example-parsed-po.json` | `GET /documents/:id` | Parsed Purchase Order |
| `example-parsed-grn.json` | `GET /documents/:id` | Parsed Goods Receipt Note |
| `example-parsed-invoice.json` | `GET /documents/:id` | Parsed Invoice |

## Match Result Examples

These show the response from `GET /match/:poNumber` under different scenarios.

| File | Status | Scenario |
|---|---|---|
| `example-match-result-mismatch.json` | `mismatch` | All three documents present; invoice date (2026-03-24) is after PO date (2026-03-17), and GRN only partially received items 18003 and 18004 |
| `example-match-result-insufficient.json` | `insufficient_documents` | Only PO uploaded; no GRN or Invoice found yet |

## Match Status Values

| Status | Meaning |
|---|---|
| `matched` | All quantities and dates pass every check |
| `partially_matched` | No rule violations, but not all PO quantities have been received/invoiced yet |
| `mismatch` | At least one rule violation found (see `reasons`) |
| `insufficient_documents` | PO, GRN, or Invoice not yet available to attempt matching |

## Reason Codes

| Code | Rule |
|---|---|
| `grn_qty_exceeds_po_qty` | A GRN item quantity exceeds the ordered quantity in the PO |
| `invoice_qty_exceeds_po_qty` | An invoiced quantity exceeds the ordered quantity in the PO |
| `invoice_qty_exceeds_grn_qty` | An invoiced quantity exceeds what was actually received (sum of all GRNs) |
| `invoice_date_after_po_date` | Invoice was issued after the PO date |
| `duplicate_po` | A second PO was uploaded for the same `poNumber` |
| `item_missing_in_po` | An item in a GRN or Invoice has no matching entry in the PO |

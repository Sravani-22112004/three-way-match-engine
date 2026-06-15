import assert from "node:assert/strict";
import test from "node:test";
import { computeMatch } from "../src/services/matchService.js";

const po = {
  _id: "po1",
  documentType: "po",
  parsedData: {
    poNumber: "PO-1",
    poDate: "2026-03-17",
    items: [
      { itemCode: "A", description: "Alpha", quantity: 10 },
      { itemCode: "B", description: "Beta", quantity: 5 }
    ]
  }
};

test("returns insufficient_documents until PO, GRN, and invoice exist", () => {
  const result = computeMatch([po]);

  assert.equal(result.status, "insufficient_documents");
  assert.deepEqual(result.reasons.sort(), ["missing_grn", "missing_invoice"]);
});

test("matches when item quantities agree across PO, GRN, and invoice", () => {
  const result = computeMatch([
    po,
    {
      _id: "grn1",
      documentType: "grn",
      parsedData: {
        poNumber: "PO-1",
        items: [
          { itemCode: "A", receivedQuantity: 10 },
          { itemCode: "B", receivedQuantity: 5 }
        ]
      }
    },
    {
      _id: "inv1",
      documentType: "invoice",
      parsedData: {
        poNumber: "PO-1",
        invoiceDate: "2026-03-16",
        items: [
          { itemCode: "A", quantity: 10 },
          { itemCode: "B", quantity: 5 }
        ]
      }
    }
  ]);

  assert.equal(result.status, "matched");
  assert.deepEqual(result.reasons, []);
});

test("flags item-level quantity and date mismatches", () => {
  const result = computeMatch([
    po,
    {
      _id: "grn1",
      documentType: "grn",
      parsedData: {
        poNumber: "PO-1",
        items: [{ itemCode: "A", receivedQuantity: 8 }]
      }
    },
    {
      _id: "inv1",
      documentType: "invoice",
      parsedData: {
        poNumber: "PO-1",
        invoiceDate: "2026-03-18",
        items: [
          { itemCode: "A", quantity: 11 },
          { itemCode: "C", quantity: 1 }
        ]
      }
    }
  ]);

  assert.equal(result.status, "mismatch");
  assert.ok(result.reasons.includes("invoice_qty_exceeds_po_qty"));
  assert.ok(result.reasons.includes("invoice_qty_exceeds_grn_qty"));
  assert.ok(result.reasons.includes("invoice_date_after_po_date"));
  assert.ok(result.reasons.includes("item_missing_in_po"));
});

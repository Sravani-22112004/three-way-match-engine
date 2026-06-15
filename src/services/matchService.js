import { normalizeDate, normalizeItemKey, normalizeNumber, sumByItem } from "../utils/normalize.js";

const STATUS = {
  MATCHED: "matched",
  PARTIAL: "partially_matched",
  MISMATCH: "mismatch",
  INSUFFICIENT: "insufficient_documents"
};

export function computeMatch(documents) {
  const pos = documents.filter((doc) => doc.documentType === "po");
  const grns = documents.filter((doc) => doc.documentType === "grn");
  const invoices = documents.filter((doc) => doc.documentType === "invoice");
  const reasons = [];

  if (pos.length !== 1) {
    if (pos.length === 0) reasons.push("missing_po");
    if (pos.length > 1) reasons.push("duplicate_po");
  }

  if (grns.length === 0) reasons.push("missing_grn");
  if (invoices.length === 0) reasons.push("missing_invoice");

  if (pos.length !== 1 || grns.length === 0 || invoices.length === 0) {
    return buildResult(STATUS.INSUFFICIENT, reasons, documents, []);
  }

  const po = pos[0].parsedData;
  const poDate = normalizeDate(po.poDate);
  const poItems = sumByItem(po.items || [], "quantity");
  const grnItems = sumByItem(
    grns.flatMap((doc) => doc.parsedData.items || []),
    "receivedQuantity"
  );
  const invoiceItems = sumByItem(
    invoices.flatMap((doc) => doc.parsedData.items || []),
    "quantity"
  );

  const itemKeys = new Set([...poItems.keys(), ...grnItems.keys(), ...invoiceItems.keys()]);
  const itemResults = [];

  for (const key of itemKeys) {
    const poItem = poItems.get(key);
    const grnItem = grnItems.get(key);
    const invoiceItem = invoiceItems.get(key);
    const itemReasons = [];
    const poQty = poItem?.quantity || 0;
    const grnQty = grnItem?.quantity || 0;
    const invoiceQty = invoiceItem?.quantity || 0;

    if (!poItem) itemReasons.push("item_missing_in_po");
    if (grnQty > poQty) itemReasons.push("grn_qty_exceeds_po_qty");
    if (invoiceQty > poQty) itemReasons.push("invoice_qty_exceeds_po_qty");
    if (invoiceQty > grnQty) itemReasons.push("invoice_qty_exceeds_grn_qty");

    reasons.push(...itemReasons);
    itemResults.push({
      key,
      itemCode: poItem?.itemCode || grnItem?.itemCode || invoiceItem?.itemCode || null,
      description: poItem?.description || grnItem?.description || invoiceItem?.description || "",
      poQuantity: poQty,
      grnQuantity: grnQty,
      invoiceQuantity: invoiceQty,
      status: itemReasons.length ? STATUS.MISMATCH : STATUS.MATCHED,
      reasons: itemReasons
    });
  }

  for (const invoice of invoices) {
    const invoiceDate = normalizeDate(invoice.parsedData.invoiceDate);
    if (poDate && invoiceDate && invoiceDate > poDate) {
      reasons.push("invoice_date_after_po_date");
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  const status = uniqueReasons.length
    ? STATUS.MISMATCH
    : hasQuantityGaps(itemResults)
      ? STATUS.PARTIAL
      : STATUS.MATCHED;

  return buildResult(status, uniqueReasons, documents, itemResults);
}

function hasQuantityGaps(itemResults) {
  return itemResults.some((item) => (
    item.poQuantity !== item.grnQuantity ||
    item.poQuantity !== item.invoiceQuantity
  ));
}

function buildResult(status, reasons, documents, itemResults) {
  return {
    status,
    reasons,
    itemResults,
    documentIds: {
      po: documents.filter((doc) => doc.documentType === "po").map((doc) => doc._id),
      grn: documents.filter((doc) => doc.documentType === "grn").map((doc) => doc._id),
      invoice: documents.filter((doc) => doc.documentType === "invoice").map((doc) => doc._id)
    }
  };
}

export function inferPoNumber(parsedData, documentType) {
  const field = {
    po: "poNumber",
    grn: "poNumber",
    invoice: "poNumber"
  }[documentType];

  return parsedData?.[field] ? String(parsedData[field]).trim() : "";
}

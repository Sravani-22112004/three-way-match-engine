export function normalizeNumber(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeItemKey(item) {
  const code = item.itemCode || item.sku || item.hsnCode;
  if (code) return String(code).trim().toLowerCase();

  return String(item.description || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function sumByItem(items, quantityField = "quantity") {
  return items.reduce((acc, item) => {
    const key = normalizeItemKey(item);
    if (!key) return acc;

    acc.set(key, {
      key,
      itemCode: item.itemCode || item.sku || null,
      description: item.description || "",
      quantity: (acc.get(key)?.quantity || 0) + normalizeNumber(item[quantityField])
    });

    return acc;
  }, new Map());
}

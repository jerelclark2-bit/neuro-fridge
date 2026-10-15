// NeuroFridge inventory helpers. No network or account required.
export const demoCatalog = Object.freeze({
  '012345678905': 'Milk',
  '036000291452': 'Eggs',
  '049000028911': 'Orange juice',
  '041196910005': 'Apples'
});
const MAX_QUANTITY = 9999;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeEntry({ barcode = '', name = '', quantity = 1, expires = '' }) {
  const code = String(barcode).trim();
  const label = String(name).trim().replace(/\s+/g, ' ') || demoCatalog[code] || '';
  const count = Number(quantity);
  const date = String(expires).trim();
  if (code && !/^[A-Za-z0-9-]{3,32}$/.test(code)) {
    throw new Error('Barcode must have 3–32 letters, numbers, or dashes.');
  }
  if (!label || label.length > 80) {
    throw new Error('Enter an item name (up to 80 characters).');
  }
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_QUANTITY) {
    throw new Error('Quantity must be a whole number between 1 and 9,999.');
  }
  if (date) {
    const parsed = new Date(date + 'T00:00:00Z');
    if (!datePattern.test(date) || Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date) {
      throw new Error('Enter a valid expiration date.');
    }
  }
  return {
    id: code ? 'barcode:' + code : 'name:' + label.toLowerCase(),
    barcode: code,
    name: label,
    quantity: count,
    expires: date
  };
}

export function addItem(inventory, entry) {
  const item = normalizeEntry(entry);
  const existing = inventory.find(row => row.id === item.id);
  if (!existing) return [...inventory, item];
  const quantity = existing.quantity + item.quantity;
  if (quantity > MAX_QUANTITY) throw new Error('This quantity would exceed 9,999.');
  return inventory.map(row => row.id === item.id
    ? { ...row, name: item.name, quantity, expires: item.expires || row.expires }
    : row);
}

export function changeQuantity(inventory, id, delta) {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new Error('Invalid change.');
  const row = inventory.find(item => item.id === id);
  if (!row) return inventory;
  const next = row.quantity + delta;
  if (next > MAX_QUANTITY) throw new Error('Quantity cannot exceed 9,999.');
  if (next <= 0) return inventory.filter(item => item.id !== id);
  return inventory.map(item => item.id === id ? { ...item, quantity: next } : item);
}

export function removeItem(inventory, id) {
  return inventory.filter(item => item.id !== id);
}

export function daysUntil(date, today) {
  if (!date) return null;
  const a = new Date(date + 'T00:00:00Z').getTime();
  const b = new Date(today + 'T00:00:00Z').getTime();
  return Math.round((a - b) / 86400000);
}

export function expiryStatus(date, today) {
  const days = daysUntil(date, today);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 3) return 'soon';
  return 'fresh';
}

export function toCSV(inventory) {
  const quote = value => {
    let s = String(value ?? '');
    if (/^[=+\-@]/.test(s)) s = "'" + s; // avoid spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
  };
  return [
    'Name,Barcode,Quantity,Expiration',
    ...inventory.map(row => [row.name, row.barcode, row.quantity, row.expires].map(quote).join(','))
  ].join('\r\n') + '\r\n';
}

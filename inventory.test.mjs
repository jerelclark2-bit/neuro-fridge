import test from 'node:test';
import assert from 'node:assert/strict';
import { addItem, normalizeEntry, changeQuantity, removeItem, expiryStatus, toCSV } from './inventory-core.js';

test('a known demo barcode suggests a name', () => {
  assert.equal(normalizeEntry({ barcode: '012345678905' }).name, 'Milk');
});
test('an unknown barcode needs a name', () => {
  assert.throws(() => normalizeEntry({ barcode: '867530900001' }), /name/);
});
test('matching barcodes add to quantity without creating duplicates', () => {
  const a = addItem([], { barcode: '012345678905', quantity: 2 });
  const b = addItem(a, { barcode: '012345678905', quantity: 3 });
  assert.equal(b.length, 1);
  assert.equal(b[0].quantity, 5);
});
test('manual items merge case insensitively', () => {
  const rows = addItem(addItem([], { name: 'Bananas' }), { name: 'BANANAS', quantity: 2 });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 3);
});
test('using the last item removes it', () => {
  const rows = addItem([], { name: 'Cheese' });
  assert.equal(changeQuantity(rows, rows[0].id, -1).length, 0);
  assert.equal(removeItem(rows, rows[0].id).length, 0);
});
test('dates are validated and statuses are based on calendar days', () => {
  assert.throws(() => normalizeEntry({ name: 'Milk', expires: '2026-02-30' }), /valid expiration/);
  assert.equal(expiryStatus('2026-10-12', '2026-10-15'), 'expired');
  assert.equal(expiryStatus('2026-10-18', '2026-10-15'), 'soon');
  assert.equal(expiryStatus('2026-10-20', '2026-10-15'), 'fresh');
});
test('CSV escapes user content and spreadsheet formulas', () => {
  const csv = toCSV([{name:'=HYPERLINK("x")',barcode:'123',quantity:1,expires:''}]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes('""x""'));
});

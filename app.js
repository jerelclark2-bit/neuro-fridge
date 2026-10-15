import { demoCatalog, addItem, changeQuantity, removeItem, expiryStatus, daysUntil, toCSV } from './inventory-core.js';

const $ = id => document.getElementById(id);
const STORE_KEY = 'neurofridge.inventory.v1';
let inventory = [];

try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  if (Array.isArray(saved)) {
    inventory = saved.filter(row => row && typeof row.id === 'string' &&
      typeof row.name === 'string' && Number.isSafeInteger(row.quantity) &&
      row.quantity >= 1 && row.quantity <= 9999 && typeof row.expires === 'string' &&
      typeof row.barcode === 'string');
  }
} catch (err) {
  console.warn('Could not load the saved inventory', err);
}

const dateToday = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
};

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(inventory));
    return true;
  } catch (err) {
    console.warn('Local storage is unavailable', err);
    message("Couldn't save to this browser. Export your inventory before leaving.", false);
    return false;
  }
}

function message(text, ok) {
  const target = $('formMessage');
  target.textContent = text;
  target.classList.toggle('good', !!ok);
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render() {
  const today = dateToday();
  $('totalItems').textContent = inventory.length;
  $('totalUnits').textContent = inventory.reduce((sum, row) => sum + row.quantity, 0).toLocaleString();
  $('soonItems').textContent = inventory.filter(row => expiryStatus(row.expires, today) === 'soon').length;
  $('expiredItems').textContent = inventory.filter(row => expiryStatus(row.expires, today) === 'expired').length;
  const q = $('search').value.trim().toLowerCase();
  const filter = $('filter').value;
  const matching = inventory.filter(row => {
    const status = expiryStatus(row.expires, today);
    const matches = row.name.toLowerCase().includes(q) || row.barcode.toLowerCase().includes(q);
    return matches && (filter === 'all' || (filter === 'undated' ? status === 'unknown' : filter === status));
  }).sort((a, b) => a.name.localeCompare(b.name));
  const list = $('inventory');
  list.replaceChildren();
  if (!matching.length) {
    const box = el('div', 'empty');
    box.append(el('span','', '🧊'), el('b','', inventory.length ? 'Nothing matches.' : 'Your fridge is empty!'));
    box.append(el('small','', inventory.length ? 'Try another search or filter.' : 'Add something on the left to get started.'));
    list.append(box);
    return;
  }
  for (const row of matching) {
    const status = expiryStatus(row.expires, today);
    const entry = el('article', 'entry');
    const text = el('div','item');
    text.append(el('div','item-title', row.name));
    if (row.barcode) text.append(el('div','item-meta', 'BARCODE: ' + row.barcode));
    let label = 'NO EXPIRY DATE';
    if (status === 'expired') label = 'PAST DATE · ' + row.expires;
    if (status === 'soon') {
      const days = daysUntil(row.expires, today);
      label = days === 0 ? 'BEST BY TODAY' : 'BEST BY IN ' + days + ' DAY' + (days === 1 ? '' : 'S');
    }
    if (status === 'fresh') label = 'BEST BY ' + row.expires;
    text.append(el('div', 'flag ' + (status === 'expired' || status === 'soon' ? status : ''), label));
    const buttons = el('div','controls');
    const minus = el('button','', '−');
    minus.type='button'; minus.title='Use one '+row.name;
    minus.setAttribute('aria-label','Use one '+row.name);
    minus.addEventListener('click', () => adjust(row.id, -1));
    const count = el('strong','',String(row.quantity));
    const plus = el('button','', '+');
    plus.type='button'; plus.title='Add one '+row.name;
    plus.setAttribute('aria-label','Add one '+row.name);
    plus.addEventListener('click', () => adjust(row.id, 1));
    const remove = el('button','remove','×');
    remove.type='button'; remove.title='Remove '+row.name;
    remove.setAttribute('aria-label','Remove '+row.name);
    remove.addEventListener('click', () => {
      if (confirm('Remove '+row.name+' from your fridge?')) {
        inventory = removeItem(inventory, row.id);
        save(); render();
      }
    });
    buttons.append(minus,count,plus,remove);
    entry.append(text,buttons);
    list.append(entry);
  }
}

function adjust(id, delta) {
  try {
    inventory = changeQuantity(inventory,id,delta);
    save(); render();
  } catch(err) { message(err.message || 'Could not change quantity.',false); }
}

$('barcode').addEventListener('input', () => {
  const code=$('barcode').value.trim();
  if (demoCatalog[code] && !$('name').value.trim()) $('name').value=demoCatalog[code];
});
$('addForm').addEventListener('submit', e => {
  e.preventDefault();
  try {
    const entry = {
      barcode:$('barcode').value, name:$('name').value,
      quantity:$('quantity').value, expires:$('expires').value
    };
    inventory = addItem(inventory,entry);
    const label = entry.name.trim() || demoCatalog[entry.barcode.trim()] || 'Item';
    const persisted = save();
    render();
    message(persisted ? 'Added '+label+' to the fridge!' : 'Added, but could not save locally.', persisted);
    $('addForm').reset();
    $('barcode').focus();
  } catch (err) { message(err.message || 'Check the form and try again.',false); }
});
for (const button of document.querySelectorAll('[data-code]')) {
  button.addEventListener('click', () => {
    $('barcode').value=button.dataset.code;
    $('name').value=demoCatalog[button.dataset.code] || '';
    $('quantity').value='1';
    $('barcode').focus();
    message('Example selected. Press ADD TO FRIDGE when ready.',true);
  });
}
$('search').addEventListener('input', render);
$('filter').addEventListener('change', render);
$('clear').addEventListener('click', () => {
  if (!inventory.length) return;
  if (confirm('Empty the whole fridge? This cannot be undone. Export a backup first if needed.')) {
    inventory = []; save(); render(); message('Fridge emptied.',true);
  }
});
$('export').addEventListener('click', () => {
  const csv=toCSV(inventory);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download='neurofridge-inventory.csv';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
});
render();

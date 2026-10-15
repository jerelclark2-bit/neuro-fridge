# NeuroFridge 🥛

A little grocery-inventory app with a barcode-first workflow.

Scan a barcode with a USB scanner (or type one in), add the item, and see what's currently in your fridge. Keep track of quantities, mark items as used, and see which foods are coming up on their expiration date.

This repo was empty, so this is a **new browser-based MVP** rebuilt from the original barcode-inventory concept. It is not a recovered copy of the earlier Python prototype.

**[OPEN NEUROFRIDGE](https://jerelclark2-bit.github.io/neuro-fridge/)** · [Check tests](https://github.com/jerelclark2-bit/neuro-fridge/actions/workflows/tests.yml)

### How it's put together

The UI is plain HTML, CSS, and JavaScript. `inventory-core.js` contains the item validation, quantity changes, expiration-date logic, and CSV export. `app.js` handles the interface and saves the inventory to `localStorage`.

This is intentionally a **single-browser MVP**. It doesn't pretend to sync across devices or recognize arbitrary products from the internet. Sample barcode names are just examples. Automated tests check duplicate entries, quantity changes, expiry classification, and safe CSV escaping.

### Running it

The browser app uses JavaScript modules, so run it through a local web server (double-clicking the HTML file may not work). Python 3 is enough:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. No dependency installation or sign-in required.

The browser demo is hosted with GitHub Pages at https://jerelclark2-bit.github.io/neuro-fridge/.

### What it does

- Enter or scan barcodes (scanners that type like keyboards work), with an optional item-name field.
- Add food and change quantities, save expiration dates, search, and remove items.
- A tiny **sample** barcode catalog fills in a few demonstration names. It is not a real grocery database.
- Save inventory locally in this browser via `localStorage`; export a CSV backup.
- No account, cloud sync, external barcode API, or camera-scanning support yet.

A separate product lookup API and synced multi-device inventory would be useful future upgrades. For now, the focus is a reliable working inventory.

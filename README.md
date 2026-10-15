# NeuroFridge 🥛

A little grocery-inventory app with a barcode-first workflow.

Scan a barcode with a USB scanner (or type one in), add the item, and see what's currently in your fridge. Keep track of quantities, mark items as used, and see which foods are coming up on their expiration date.

This repo was empty, so this is a **new browser-based MVP** rebuilt from the original barcode-inventory concept. It is not a recovered copy of the earlier Python prototype.

### Running it

Open `index.html` in a browser. No dependencies or sign-in are required.

For the web version, enable GitHub Pages for `main` / `(root)` in the repository settings. The address will be:

https://jerelclark2-bit.github.io/neuro-fridge/

### What it does

- Enter or scan barcodes (scanners that type like keyboards work), with an optional item-name field.
- Add food and change quantities, save expiration dates, search, and remove items.
- A tiny **sample** barcode catalog fills in a few demonstration names. It is not a real grocery database.
- Save inventory locally in this browser via `localStorage`; export a CSV backup.
- No account, cloud sync, external barcode API, or camera-scanning support yet.

A separate product lookup API and synced multi-device inventory would be useful future upgrades. For now, the focus is a reliable working inventory.

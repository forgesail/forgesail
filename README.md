# ForgeSail Rail Selector

A static, offline-first prototype for the ForgeSail rail data hub. It turns the global crane and specialty rail specification table into searchable, comparable, downloadable structured data.

## Open

Open `index.html` directly in a browser. No build step or server is required.

## Data

- `data/rails.json`: canonical JSON dataset.
- `data/rails.js`: browser-loadable copy of the same dataset.
- `data/rails.csv`: flat CSV for spreadsheets.

Each record contains:

```text
id, model, standard, category, region,
base_mm, head_mm, height_mm, mass_kg_m,
materials, cn_replacement, drawing_url, drawing_label, product_url
```

The page also shows, for each selected profile, a schematic outline, common
material grades, typical mechanical properties, composition ranges, and a
China / Europe / US grade reference.

## Current Scope

The prototype contains 135 rail drawing references across 12 standard families from the ForgeSail drawing index, all with dimensions:

- DIN
- GB / YB
- UIC / EN 13674
- AREMA / ASTM / ASCE
- ARBED / MRS
- JIS
- IRS / IS 3443
- ISCOR
- BS
- GOST
- AS / BHP
- PN

The fastening selector remains a 14-scheme preview and embeds the published
ForgeSail configuration PDF for each selected combination.

## Regenerate Data

Edit `build_rail_data.py` and run:

```bash
python3 build_rail_data.py
```

This rewrites `data/rails.json`, `data/rails.js`, `data/rails.csv` and
`data/materials.js` from the same source of truth.

## Notes

- Dimensions are reference values from `https://forgesail.com/products/rails/`. Verify against the governing standard and the manufacturer drawing before engineering use.
- This is a product prototype. The drawing links currently point to ForgeSail's existing PDFs.
- The public dataset should be reviewed for accuracy and rights before publishing as an open-data release.

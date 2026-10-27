# Steel Framing Checker — quickshopv2

A new standalone React/Vite application for comparing **steel framing member sizes** between structural engineer drawings and steel shop drawing PDFs.

## Features
- Upload structural and shop PDFs, processed locally in your browser.
- Automatically read text from every PDF page and attempt to identify level from title text.
- Recognize W/S/M/HP/C/MC and HSS section callouts.
- Extract beam/girder marks when a single member mark and size occur on the same PDF text line.
- Compare **unique same-level member marks** and flag different sizes as *candidates*, with structural/shop PDF page numbers.
- Review matching members, unresolved repeated marks, and export mismatch comments to CSV.
- No manual level entry.

## Run locally
```bash
npm install
npm run dev
```

## GitHub Pages
The workflow in `.github/workflows/deploy.yml` builds and deploys on pushes to `main`. In **Settings → Pages**, select **GitHub Actions** as the source. Target URL: https://zixuanhuang970404-code.github.io/quickshopv2/

## Engineering limitations — read before use
This is an early, unvalidated proof of concept, **not a comprehensive or approved automated shop drawing check**. Current matching uses only detected level and a unique explicit member mark. It does not identify a beam's physical grid location, geometrically align framing plans, distinguish identical marks used in different areas, or process scanned/image-only PDFs using OCR. PDF line extraction can reorder or split annotations; many members will be missed. Different shop/design marks do not match. Matches, mismatches and zero findings all require licensed engineer confirmation. Reports are candidate findings, not approval. Keep documents confidential and do not upload sensitive drawings to a public repository.

## Next development
1. Region-based PDF geometry extraction, rotation and viewport overlays.
2. Associate member callouts with linework and grid bubbles to establish coordinates and spans.
3. Match members by building level, grid intersection and span before comparing sizes.
4. OCR/scanned drawing support, visual cross-reference and confidence thresholds.
5. Regression tests on representative structural and fabricator sets.

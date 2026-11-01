# V6 material and corner refinement

The authenticated center now uses an original generated forest-charcoal mineral texture with restrained bronze veining. It continues through gutters and below-fold space, behind the existing architectural side images. Horizontal and vertical masks blend those edges into the center. Header, filter, export, link and explorer surfaces use quieter material layers; attendance rows and the ivory Markdown overview retain calm reading backgrounds. There is no added motion or blur enlargement.

`src/portal-material.css` owns the scoped system: 18px panels (16px mobile), 22px dialogs (20px mobile), 9px controls and 14px buttons. Cards, project headers, bookmarks, explorer/drop zones, overview/export, attendance sections/table, profile dialogs and menus share related corners. Avatars stay circular. Table cells and folder fans are not blanket-clipped. The original action surface retains its existing pending geometry.

## Generated asset

- Delivery: `public/assets/portal-material-v6.webp`, 1536×1024, WebP quality 90, 405460 bytes.
- CSS repeat size: 768×512; no enlargement through DPR2. One shared local asset serves backdrop and quiet panel layers.
- Source: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-946aacfb-fec5-4bbc-9e89-cbc18acd16ad.png`.
- Generated source, optimized delivery and rendered pages were visually inspected. Repetition is subdued by lighting and panels; this is a generated material, not a mathematically seamless procedural tile.

Prompt:

> Use case: stylized-concept. Asset type: seamless tileable architectural material texture for the CENTER backdrop of an elegant dark Art Deco internal workspace. Landscape 1536x1024. Entire frame is a tactile very dark charcoal/forest green mineral plaster and smoky walnut-toned patina, sparse extremely fine aged bronze mineral veins, restrained fine analog paper grain. Subtle broad diffuse warm light softly grazes the material, quiet dimensional tonal variation with no hard light hotspot. Premium hand-painted cel-animation architectural background material. It must tile on all edges, with no obvious repeat landmarks, no vignette border, no frames, no columns, no furniture, no objects, no text, no symbols, no UI, no purple or blue neon. Restrained low contrast, near-black forest and warm graphite with occasional subtle brass mineral detail; keep it readable as real material rather than flat solid color, do not blur. Intended to blend behind existing dark walnut/brass architectural edge art and under semitransparent reading panels, never dominate text.

## Verification and integration

- Production build, TypeScript and formatting passed.
- Three affected production Chromium tests passed at 1440/768/390: primary decoration bounds, static panels, reduced motion, keyboard activation/Escape/focus and no overflow.
- `node scripts/capture-material.mjs` passed: centered layouts, no horizontal overflow and 18 targeted axe scans across Projects, resources, documentation, overview, Croissantage and create dialog at the three widths. This is automated accessibility coverage, not a complete manual audit.
- 50 viewport captures include page top/middle/bottom, scrolled overview, project/profile dialogs and login comparisons. Desktop contact sheet plus full-size desktop/tablet/mobile samples were visually inspected. Evidence is in `artifacts/material-v6/` and `verification.json`.
- Approved login files retain their SHA-256 hashes. Desktop/mobile login pixels match the approved baseline exactly. Login room, Mac and composed screen assets are unchanged.
- No backend/API changes, dependencies or environment changes. Eight persisted covers and V6 button/static-card fixes remain. No cover generation or live-backend acceptance was repeated for this styling change. Prior real backend cover verification remains in `artifacts/covers-v6/`.
- Only `frontend/` was modified. Remaining external checks are the previously documented production Entra/Graph, HTTPS and non-Chromium/physical-device validation.

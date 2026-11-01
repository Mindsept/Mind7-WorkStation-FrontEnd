# Interior V4: centered workspace, approved login preserved

Date: 2026-11-01. Scope: authenticated frontend only.

## Composition

A compact horizontal header replaces the tall empty sidebar. Both primary destinations are always visible, including mobile. Brand and account controls occupy the upper row; project context remains in the existing sticky header beneath it when relevant. Navigation is semantic links with active states, keyboard access and genuine back links. Main content is centered in the viewport at a 1060px maximum, with equal responsive margins and no sidebar offsets. Project records form one coherent index; project controls and resource sections have tightened grouping. Ivory documentation remains a distinct reading plane.

## New original imagery and pixel density

Generated with built-in imagegen, then visually inspected and encoded without resizing using Sharp WebP quality 94, effort 6. No approved login asset was overwritten. These are fresh architectural compositions, not enlarged copies of previous artwork.

| Asset | Native and delivered dimensions | Bytes | Role |
| --- | --- | --- | --- |
| `public/assets/portal-archive-v4.webp` | 1024 × 1536 | 377,530 | Left walnut/brass archive frieze, quiet charcoal right edge |
| `public/assets/portal-salon-v4.webp` | 1024 × 1536 | 388,334 | Right bronze/forest salon frieze, quiet charcoal left edge |

The prior room source was 1672 × 941, subsequently delivered at 2000px wide. Viewport-wide `cover` could enlarge that source, especially in portrait layouts, and could not provide native detail at 2× pixel density. Increasing the file dimensions had not created detail. V4 instead limits each new image to 512 × 768 CSS pixels, giving exact 1:1 source-to-device-pixel mapping at DPR2. The panels are cropped/positioned at the edges without cover scaling. Larger monitors do not enlarge them; mobile uses the same density-safe crop. Gentle alpha edge fading blends the scene into charcoal, without heavy blur. The generator returned 1024 × 1536 despite a larger preferred request; this is explicitly not native 4K. Higher-than-2× density and physical devices were not separately assessed.

## Generation prompts

### Archive

Original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-0e844348-2d42-490a-98c4-9932bd44f093.png`

> Use case: stylized-concept. Asset type: ORIGINAL tall architectural side panel for a premium dark Art Deco internal team portal, portrait 2:3 composition. Generate at highest available native resolution, ideally 2048x3072. This is a new scene, not a resize or repeat of an earlier background. A very close, sharply resolved study of a nocturnal Art Deco archive interior: at the far LEFT edge three tall sculptural smoked-walnut pilasters with precisely machined aged brass rebates, at lower left a small carved black-marble ledge, a warm ivory ribbed glass sconce high left sending soft directional grazing light over tactile graphite plaster. Architecture occupies the LEFT 45 percent and gradually recedes into dark quiet charcoal negative space on the RIGHT 55 percent, completely unoccupied right edge so it blends behind centered web panels. Forest-green velvet only as a narrow lower-left inset. Elegant original stepped shapes, physically detailed brushed metal, visible fine wood pores and subtle plaster grain, warm controlled light, close architectural photography with artistic noir matte-painting finish. Crisp native texture, clean sharp edges, no blur or depth-of-field, no noise fog, no illegible texture. No wide panoramic city or room, no computer, no desk, no people, no words, no logo, no interface, no purple or neon, no decorative line wallpaper. Full-bleed portrait crop. Warm black charcoal dominates, brass is restrained and not bright gold.

### Salon

Original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-a2bf12b8-a672-4526-8165-8ca4ff0b1402.png`

> Use case: stylized-concept. Asset type: ORIGINAL tall architectural side panel for a premium dark Art Deco team café portal, portrait 2:3 composition. Generate at highest available native resolution, ideally 2048x3072. A fresh close architectural composition: at far RIGHT a curved fluted smoked-bronze glass partition and sculpted black stone column, one refined vertical warm ivory glass lamp on brass bracket, at lower RIGHT a partial deep forest velvet banquette with sharply visible seam detail and the edge of a small dark walnut side table. Golden side light skims the ribs and tactile surfaces. Deliberately asymmetrical, strongest architectural detail in RIGHT 45 percent; LEFT 55 percent fades naturally into an empty deep charcoal plaster wall, no objects there, suitable behind centered readable web panels. Refined noir Art Deco realism with crisp matte-painted architectural precision. Rich physical depth, crisp native material detail, sharp clean contours, no lens blur, no mist, no fake film noise. Restrained charcoal, forest, smoky walnut and aged brass, never violet or neon. No computer, no people, no text, no logo, no UI, no wide panorama, no stock luxury lobby, no symmetrical ornamental wallpaper. Full bleed tall portrait, dark quiet left edge.

## Verification

`scripts/capture-interior.mjs` captures Projects, resources, documentation and Croissantage at top/middle/bottom scroll at 1440×900, 768×1024, 390×900, and 1440×900 DPR2. It asserts centered geometry, no overflow, unchanged login pixels and unchanged approved source hashes. Results and final screenshots are under `artifacts/interior-v4/`. A 1:1 retina crop, `background-retina-native-detail.png`, was visually inspected for material detail and clean edges.

Approved sign-in component, studio CSS, room/Mac assets and identity asset are SHA-256 identical. Desktop/mobile signed-out screenshots before and after are pixel-identical with reduced motion. The authentication implementation and API contract were not changed. The full 15-test Chromium suite, typecheck, production build and formatting passed. Responsive tests now cover directly visible horizontal navigation, keyboard route changes, equal centering and persistent project context. Previous live backend checks are historical evidence, not newly rerun for this shell-only revision.

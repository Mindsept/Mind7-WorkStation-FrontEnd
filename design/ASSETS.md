# Visual provenance

## Current authenticated interior: V4

The current portal uses two newly generated architectural panels, `portal-archive-v4.webp` and `portal-salon-v4.webp`. Both are native 1024×1536, encoded without enlargement at WebP quality 94, and displayed at 512×768 CSS pixels for native DPR2 detail. Exact prompts, original paths, delivery sizes, pixelation diagnosis and verification are recorded in [Interior V4](INTERIOR-V4.md). These are not native 4K assets. Final portal captures are in `artifacts/interior-v4/`.

The approved V3 login composition and its room, Mac, identity, component and stylesheet remain unchanged. Desktop/mobile before-and-after pixels and approved file hashes match. Earlier interior roles described below are historical; V4 replaces those portal backgrounds without changing the login.

## V1 reference analysis (historical)

The actual supplied MindSept logo is preserved unchanged in `source/mind7-logo.png`. A 192 × 192 WebP derivative was used in V1 navigation and sign-in, retaining its violet circuitry and recognizable seven motif.

All supplied visual references were inspected in the conversation: the jazz singer, illuminated bar, noir couple, night drive, the two architectural hall scenes, monumental city entrance, the café, red/blue lounge, violet/gold lounge, and backstage composition.

They share deep ink blacks, cobalt blue rim light, amber/brass illumination, restrained burgundy and violet, hard silhouette edges, and tall stepped or arched architecture. Light pools and reflective floors create depth; fine grain softens the otherwise crisp cel-painted planes. Composition frequently uses long perspective, asymmetric subjects, repeating verticals and generous dark passages. The references contain little usable interface typography, so type is interpreted through upright geometric Outfit headings and stable DM Sans reading text rather than copying incidental lettering.

The three design choices are: recognizable task-oriented layout with architectural framing; low motion intensity for a frequently used workspace; moderately dense project lists and documentation, with a more spacious sign-in screen. Supplied reference art is not republished as application artwork.

## V1 generated asset (retained, unused by current UI)

- Mode: built-in `image_gen`, not CLI/API fallback.
- Generated original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-0e9ff4b5-41de-49cf-89a6-27926a4a41b9.png`.
- Project delivery: `frontend/public/assets/deco-reading-room.webp`, 1536 × 1024.
- Roles: sign-in architectural scene, cropped project-library banner.
- Inspection: verified original architecture, a readable dark left region, cobalt/violet window light, amber fixtures, no people or lettering, and usable mobile cropping. Text and controls remain semantic HTML.
- Optimization: converted to quality-83 WebP without changing the composition. Only the optimized local file is referenced by the application. The generation output is not a product screenshot or evidence of an actual office.

### Final prompt

> Use case: stylized-concept. Asset type: original cinematic illustration for the MindSept WorkStation internal team portal login and a cropped workspace banner. Create a wide landscape 3:2 dark Art Deco architectural reading room at night, inspired by the supplied references' cel-painted noir atmosphere: monumental stepped arches, tall brass-edged windows, deep midnight navy and ink shadows, cobalt moonlight, restrained violet reflections matching the MindSept violet logo, warm amber wall lamps, elegant glossy black stone floor. No people, no lettering, no logos, no interface. Composition: long perspective toward an off-center luminous arched window on the right, angular bookcases and a low reading table, generous quiet dark negative space on the left, keep key architecture in the central two thirds for mobile cropping. Hand-painted animation background with crisp geometric silhouettes, subtle analog grain, dramatic controlled lighting, sophisticated restrained ornament; original architecture, not a copy of any reference.

## V2: the nocturnal atelier

The redesign supersedes the V1 delivery roles above. It follows the user's requested obsidian, ivory and aged-brass direction, with restrained forest green. The original logo, monumental city entrance (`noc.png`) and backstage (`hey.png`) were inspected again. Their architectural scale, asymmetric framing, sculptural light and tactile black surfaces guide the new composition. Purple/cobalt is no longer part of the interface palette.

Josefin Sans supplies the open, geometric display lettering and brand wordmark. Outfit remains for compact section headings and DM Sans for reading and controls. All fonts are local. The three design choices are: a distinctive full-bleed architectural entry, low motion, and a compact editorial project index instead of a card grid. Documentation and attendance retain practical reading planes.

All three assets below were produced with the built-in imagegen tool, visually inspected, optimized locally with Sharp, and inspected again in the running portal. Source reference artwork is not reused as application imagery.

| Local asset | Size | Use |
| --- | --- | --- |
| `public/assets/deco-atelier-v2.webp` | 2000 px wide; 198,834 bytes | Full-bleed sign-in, project library and project-detail architecture |
| `public/assets/deco-cafe-v2.webp` | 1800 px wide; 114,830 bytes | Croissantage café scene, forest banquette, coffee and pastry |
| `public/assets/mind7-brass-v2.webp` | 320 px wide; 47,122 bytes | Transparent brass/ivory logo adaptation, navigation, sign-in and favicon |

The logo adaptation was expressly requested in the redesign. The source `design/source/mind7-logo.png` remains unchanged. The derivative retains the central seven, brain outline and circuit motif; it is an AI-assisted material/color adaptation, not a claim of pixel-identical geometry. V1 artwork and its original delivery logo are retained locally for provenance but are not referenced by the current UI.

### Atelier prompt

Generated original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-e64abe8c-f666-46b0-b75c-02fdc631e670.png`. WebP quality 87.

> Use case: stylized-concept. Asset type: premium cinematic architectural background for MindSept WorkStation sign-in and workspace masthead. Original Art Deco nocturnal atelier, very wide landscape composition. A monumental asymmetrical interior built from seven stepped black stone fins, a diagonal brass inlay descending like a lightning seven, towering faceted champagne-brass pillars and a sculptural stair rising at right. A large glowing amber frosted-glass sunburst window above a low dark walnut worktable on the right third. Small deep forest velvet accents. Obsidian lacquer, brushed aged brass, charcoal plaster and ivory light. Distinctive 1930s architectural perspective, dramatic warm grazing light, hard cel-painted silhouettes and finely textured gouache surfaces, cinematic noir animation background. Much darker broad left third as negative space, most intricate striking architecture in center/right, strong readable shapes even when cropped into a short masthead. No people, no letters, no logos, no UI. No purple, violet, blue neon, gradients, sci-fi, generic photoreal luxury hotel or excessive glowing gold outlines. Mood: a private creative atelier after dark, not a palace. Artwork fills image edge to edge.

### Café prompt

Generated original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-97304f89-f786-460f-94a5-6d04f8bb7e37.png`. WebP quality 87.

> Use case: stylized-concept. Asset type: wide horizontal Art Deco team lounge background for an internal portal called Croissantage. Original architectural illustration, 3:1 panorama. A quiet nocturnal 1930s atelier café: at right a close sculptural dark forest-green velvet banquette wraps a small circular black lacquer table bearing one ivory porcelain coffee cup and a small croissant on a champagne-brass plate. Behind it extraordinary tall stepped ribbed walnut wall panels and amber fluted glass lights create a rhythm of graphic verticals. At far left a dark angular marble arch and broad shadowed blank wall providing text-safe negative space. Warm pool of light on coffee and pastry, cinematic noir cel-painted animation background, subtle brush grain, intentional hard silhouettes, carefully restrained palette obsidian charcoal aged brass ivory with small forest green areas. Close interior framing, warm hospitality and team ritual, no people, no text, no logos, no UI, no purple, blue neon, glossy 3D cartoon or generic stock photo. Visible real architectural material texture, not endless gold lines. Place the table and banquette focal detail in right third so it remains visible behind left-aligned interface copy.

### Logo adaptation prompt

Generated original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-dc2dea38-7c92-48d8-8516-fc6f00f96f78.png`. Input: the preserved source logo; transparent background enabled; WebP quality 87.

> Use case: style-transfer. Edit target: the supplied MindSept brain-circuit seven emblem. Adapt only its materials, color and background to an elegant Art Deco brand mark. Preserve the exact recognizable central angular numeral 7, outer brain outline, bilateral circuit paths and circular terminals, overall proportions and silhouette. Render the circuit strokes, outline and seven as clean solid warm ivory/champagne gold with a very subtle engraved brass edge; high contrast and simple enough for a 48px navigation logo. Remove the existing purple glow and square backdrop completely, leaving a genuinely transparent background including negative spaces between circuitry. No purple, gradients, neon, extra ornament, added lettering, badges, rings or new symbols. The adapted emblem should feel like precision-cut brass inlay, not a photographic 3D coin. Center the complete unclipped original emblem with modest transparent margin.

### Rendered inspection

Desktop (1440 px), tablet (768 px) and mobile (390 px) screenshots are saved under `artifacts/redesign/`. Inspection covered Projects, project documentation, Croissantage, sign-in and session-expired states. The revised images remain visible in normal page headers, text stays on dark protected areas, project records use responsive index rows, and mobile export actions stack beneath their explanation. Reproduce with `node scripts/capture-redesign.mjs` while the explicit mock server runs on port 5174.

## V3: a continuous studio and a live computer screen

The user requested a substantial whole-portal revision inspired by the spatial composition of [Artocea](https://www.artocea.com/) and its [Awwwards entry](https://www.awwwards.com/sites/artocea). The live site was inspected in a browser: a continuous room, directional light, foreground object and overlaid content. We borrowed that composition principle only. No Artocea imagery, logo, code or text was copied.

Two principal original assets were generated with built-in imagegen, inspected, and optimized with Sharp. The independent screen is a third HTML/CSS composition layer using a crop of the room asset, the supplied identity derivative, and live accessible text/actions. A third generated image was unnecessary. The screen is front-facing, aligned with the generated display aperture, and does not distort its controls. A CSS contact shadow anchors the actual generated Mac cutout to the desk. The alpha was verified (transparent pixels present), then preserved during WebP encoding.

| Asset | Delivery | Spatial role |
| --- | --- | --- |
| `public/assets/studio-room-v3.webp` | 2000 px wide, quality 87, 129,002 bytes | Complete walnut desk and graphite/brass room; login environment and continuous Projects/documentation environment |
| `public/assets/studio-mac-v3.webp` | 1600 px wide, quality 90, 67,676 bytes, alpha | Independent Mac cutout with warm edge light and blank screen aperture |
| `public/assets/deco-cafe-v2.webp` | Existing original asset | Continuous Croissantage environment, including middle/bottom scroll positions |
| `public/assets/mind7-brass-v2.webp` | Existing identity adaptation | Branding and live screen identity; untouched source remains `design/source/mind7-logo.png` |

Mobile shows the whole device and places the same real Microsoft action below it at readable size. Desktop/tablet show the action inside the screen. There is one actionable DOM link, no image-baked button, password form or decorative fake application screenshot. Desktop scene geometry is stable while a short glare passes over the screen on hover/focus; motion is disabled on coarse pointers and under reduced motion. No preloader or forced sequence precedes access.

The three dials are: distinctive spatial entry with familiar task hierarchy, restrained material feedback with stable reading surfaces, and compact operational density. Authenticated screens remove the previous promotional banners and filler. Walnut project records, an ivory document plane, forest attendance surfaces and visible room between sections carry identity beyond the top of the page.

### Room generation prompt

Original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-59b70bf3-63fc-4dc7-984b-d8f4107a6fdf.png`.

> Use case: stylized-concept. Asset type: continuous cinematic room backdrop for an interactive website entrance, landscape 16:9. Original dark Art Deco creative studio at night, plausible intimate human-scale workspace, premium atmospheric physical materials. Camera straight-on, slightly above a desk top, architectural perspective verticals straight. A broad smoked walnut desk with dark leather writing surface stretches across the lower third of the image; its top surface is clearly visible from 65% to 86% of the frame, empty central-right two thirds to place a separate computer cutout later. Behind it, graphite limewash wall, a few sculptural stepped black stone pilasters and aged brass curved inlays, warm ivory ribbed-glass lamp on far right and a charcoal wall relief. Very quiet dark negative space on the left third for large live typography. Directional soft amber light from upper left, restrained pale ivory rim light from right, visible table reflections and physical shadows. Art Deco noir architectural illustration with refined matte painting realism, tactile plaster, brushed brass, dark stone and walnut, restrained fine grain, strong simple asymmetrical shapes, warm smoky depth. No computer, no screen, no laptop, no people, no text, no logo, no purple, no blue neon, no decorative gold outline wallpaper, no palace, no stock luxury lobby. The whole image is a coherent room with desk, wall, and light rather than a panoramic architecture banner. Make the blank desk area and dark backdrop behind the future computer uncluttered. Edge-to-edge image.

### Mac generation prompt

Original: `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-7640004c-e14e-4878-9fc9-f2c14f00315d.png`. Generated with `transparent_background: true`.

> Use case: product-mockup. Asset type: transparent cutout of a premium desktop Mac computer to composite on a dark Art Deco walnut desk. Subject: one complete modern slim space-black aluminum iMac-style all-in-one desktop computer, with its elegant pedestal stand and foot, no keyboard, no mouse, no wires. Camera exactly straight on to screen, screen vertical and rectangular with no skew, very slight view down onto the stand foot; symmetric front elevation. Wide landscape screen 16:9, thin dark bezel, small lower aluminum chin, refined physical machined edges. Display area pure uniformly very dark black, absolutely blank with no artwork or text or logos or reflections across screen, as real HTML will overlay it later. The screen opening should have perfectly horizontal top and bottom and vertical sides. Lighting: soft warm amber grazing light from upper left and very restrained ivory rim from right matching a nocturnal smoky walnut and graphite Art Deco room, authentic subtle amber metal reflections along the frame and stand, no blue. Fully isolated complete unclipped computer on genuinely transparent alpha background, modest transparent margin around all sides, no backdrop, no floor, no baked shadow rectangle, no people, no branding, no lettering, no watermark, no extra objects. Highly refined tactile product rendering, realistic thin body, no exaggerated futuristic design. Large clearly identifiable computer silhouette suitable for a login portal, crisp alpha edges.

### React Bits provenance and adaptations

`react-bits:glare-hover`, TS-CSS, revision `d86fccbd477786f94ca7eb891fbe0ec039d3cd3b`, is installed at `src/components/react-bits/GlareHover/` and mounted by `src/components/sign-in.tsx`. The pinned manifest and upstream licence are retained in `.premium-frontend/`. It adds a material finishing response to the computer glass, not the defining composition itself. Alternatives GlassSurface, Silk and ShinyText were considered; distortion and continuous effects were unsuitable for readable repeated access. The wrapper is adapted through scoped CSS: no pointer capture, no moving content, equivalent focus feedback, no pointer cursor for a non-button, and a static surface on touch/reduced motion. No additional package dependencies were needed. Its hover/focus and static paths were exercised in the rendered app.

### Final visual evidence

`node scripts/capture-studio.mjs` captures desktop 1440×900, tablet 768×1024 and mobile 390×900, including Projects, resources, documentation and Croissantage at top/middle/bottom scroll; login, keyboard focus and expired state; and screen bounds/motion checks. Final evidence is in `artifacts/studio-v3/`. Earlier `artifacts/redesign/` and `artifacts/portal-v3/` are historical iteration evidence, not the final capture set. The final screenshots were visually inspected after fixing an inherited even-row mobile grid conflict and making Markdown code blocks keyboard-scrollable.

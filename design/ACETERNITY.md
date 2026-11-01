# Component attribution

WorkStation includes adapted public Aceternity UI components and an original export interaction. Public component source was inspected on 2026-11-01; these are application adaptations, not a redistributed component library.

| Source                                                                    | Local implementation                                                                                                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Loader](https://ui.aceternity.com/components/loader)                     | `src/components/action-button.tsx`: operation-bound loader with stable native control and focus                                                    |
| [Images Badge](https://ui.aceternity.com/components/images-badge)         | `src/components/images-badge.tsx`: folder geometry with local resource-type cards and reduced-motion behavior                                      |
| [File Upload](https://ui.aceternity.com/components/file-upload)           | `src/components/file-upload.tsx`: alternating grid and raised paper with native accessible input/drop handling; original design credit Natko Hasic |
| [Fluid Notch preview](https://ui.aceternity.com/interactions/fluid-notch) | `src/components/fluid-action.tsx`: original implementation inspired by the public preview; no official paid source used                            |

Original public component code: Aceternity UI, Aceternity Labs LLC, copyright 2026, all rights reserved. See the [official licence](https://ui.aceternity.com/licence). These components are used as modified parts of WorkStation, not offered as standalone components, stock or templates. Source comments preserve attribution. No MIT license is asserted for Aceternity code.

The login's GlareHover component comes from React Bits at revision `d86fccbd477786f94ca7eb891fbe0ec039d3cd3b`, TypeScript/CSS variant. Its MIT + Commons Clause notice is retained in `.premium-frontend/licences/react-bits-d86fccbd477786f94ca7eb891fbe0ec039d3cd3b.md`; installation metadata remains in `.premium-frontend/manifest.json`. Reduced-motion and coarse-pointer styling disable the glare effect where appropriate.

Motion powers operation feedback and folder/upload details. Project and attendance panels remain static. Controls retain semantic buttons, keyboard focus and actual request progress; no invented delay or success state is used.

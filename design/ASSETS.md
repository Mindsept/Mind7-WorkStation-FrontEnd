# Visual assets

The supplied MindSept logo is preserved unchanged at `source/mind7-logo.png`. The application uses the approved brass adaptation `public/assets/mind7-brass-v2.webp`. Original generated artwork was created for this project using the built-in image-generation tool and optimized to local WebP files.

The reference direction combines cinematic Art Deco architecture, geometric repetition, deep shadows, warm brass lighting and illustrated material textures. Current interface surfaces use charcoal, forest green, walnut, brass and ivory. No personal profile photo is generated or bundled.

| Delivered files                                                                                                                                                   | Application role                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `studio-room-v3.webp`, `studio-mac-v3.webp`                                                                                                                       | Login room, computer and coordinated screen backdrop            |
| `portal-archive-v4.webp`, `portal-salon-v4.webp`                                                                                                                  | Architectural edges around the workspace                        |
| `portal-material-v6.webp`                                                                                                                                         | Continuous charcoal/forest material across the workspace        |
| `card-archive-v5.webp`, `card-team-v5.webp`                                                                                                                       | Archive/salon project covers and attendance illustration        |
| `covers/atelier-v6.webp`, `covers/observatory-v6.webp`, `covers/library-v6.webp`, `covers/gallery-v6.webp`, `covers/conservatory-v6.webp`, `covers/vault-v6.webp` | Additional persisted project cover choices                      |
| `deco-atelier-v2.webp`, `deco-cafe-v2.webp`                                                                                                                       | Referenced supporting artwork in the existing stylesheet layers |
| `mind7-brass-v2.webp`                                                                                                                                             | Application identity and favicon                                |

All paths in the table are relative to `public/assets/`. The backend stores project cover keys; the frontend maps those keys to this catalog without runtime image generation or remote asset fetches. The original source logo is not included in `dist/`.

Outfit, DM Sans and Josefin Sans are self-hosted through their Fontsource packages. Retain their package license notices when redistributing the application. Images are decorative where appropriate; navigation and document semantics remain real HTML rather than text baked into artwork.

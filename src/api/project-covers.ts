// Exact backend enum order; asset URLs remain a frontend delivery concern.
export const COVER_KEYS = [
  "archive",
  "atelier",
  "observatory",
  "library",
  "gallery",
  "conservatory",
  "salon",
  "vault",
] as const;
export type CoverKey = (typeof COVER_KEYS)[number];
export const PROJECT_COVERS: Record<CoverKey, string> = {
  archive: "/assets/card-archive-v5.webp",
  atelier: "/assets/covers/atelier-v6.webp",
  observatory: "/assets/covers/observatory-v6.webp",
  library: "/assets/covers/library-v6.webp",
  gallery: "/assets/covers/gallery-v6.webp",
  conservatory: "/assets/covers/conservatory-v6.webp",
  salon: "/assets/card-team-v5.webp",
  vault: "/assets/covers/vault-v6.webp",
};
export function projectCover(project: {
  id: string;
  cover_key?: string | null;
}) {
  const key = project.cover_key;
  if (key && Object.hasOwn(PROJECT_COVERS, key))
    return PROJECT_COVERS[key as CoverKey];
  // Older metadata matches the documented migration backfill and never rerolls.
  const finalByte = Number.parseInt(project.id.slice(-2), 16);
  return PROJECT_COVERS[
    COVER_KEYS[Number.isNaN(finalByte) ? 0 : finalByte % COVER_KEYS.length]
  ];
}

# AGENTS.md - GongZu Project Rules

## URL / Route Rules

- **Never put Chinese characters in URL paths, route slugs, filenames used in links, or shareable links.**
- Every quiz tag that can appear in `/:userId/:date/:tag` must have an explicit ASCII slug in `src/lib/tags.ts`.
- Do not rely on `encodeURIComponent(tag)` for user-facing quiz links; add a stable English/kebab-case slug first.
- When adding a new Chinese tag, update both directions through `tagToSlug`/`slugToTag` by adding it to `tagToSlug`.
- Share links using ASCII slugs only, e.g. `/ryan/2026-04-30/chinese-pinyin`, not percent-encoded Chinese.

## Data Safety

- Do not run broad database resets. Only delete/reset by explicit user/date/quiz scope.
- Verify API/database results from tool output; do not infer success from expected behavior.

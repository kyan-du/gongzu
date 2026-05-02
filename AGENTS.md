# AGENTS.md - GongZu Project Rules

## URL / Route Rules

- **Never put Chinese characters in URL paths, route slugs, filenames used in links, or shareable links.**
- **Never send percent-encoded Chinese slugs** such as `/%E5%8F%A3...` in WeChat/Telegram notifications, cron outputs, scripts, docs examples, or UI links.
- Every quiz tag that can appear in `/:userId/:date/:tag` must have an explicit ASCII slug in `src/lib/tags.ts`.
- Generate quiz links through `getSlug(tag)` or the explicit mapping in `src/lib/tags.ts`; do not hand-roll link strings from raw Chinese tags.
- Do not rely on `encodeURIComponent(tag)` for user-facing quiz links; add a stable English/kebab-case slug first.
- When adding a new Chinese tag, update both directions through `tagToSlug`/`slugToTag` by adding it to `tagToSlug`.
- Share links using ASCII slugs only, e.g. `/ryan/2026-05-02/mental-math`, `/ryan/2026-05-02/patterns`, `/ryan/2026-05-02/word-problems`; never use percent-encoded Chinese.
- Before committing link/notification changes, run `npm run check`; it includes `scripts/check-ascii-slugs.mjs` to catch Chinese/percent-encoded slug regressions.

## Data Safety

- Do not run broad database resets. Only delete/reset by explicit user/date/quiz scope.
- Verify API/database results from tool output; do not infer success from expected behavior.

## Chinese Pinyin Quiz Rules

- For low-grade `语文拼音` reading cards, use **one passage/poem per quiz card** unless the user explicitly asks for multiple passages.
- Each passage should have exactly **5 sub-questions**.
- Do **not** ask for a character's pronunciation if the same character's pinyin is already shown in the passage. If a character is a test target, leave all occurrences of that character in the passage unannotated/red-only so the answer is not exposed above.
- Keep the original text visible with pinyin annotations for non-target characters; target characters should remain readable as Chinese characters, not blanks.

# Task: Extract Header Component + Fix Bugs

## 1. Create `src/components/Header.tsx` — Shared Header Component

Extract the header (logo + subtitle + user menu) into a reusable component.

```tsx
interface HeaderProps {
  userId: string;  // 'cyan' | 'ryan' | 'parent' etc
}
```

**Requirements:**
- Logo (dark/light) + "拱卒" title + "日拱一卒，功不唐捐" subtitle
- Title and subtitle must be **text-left** aligned (inside a `<div className="text-left">`)
- Clicking logo area navigates to `/${userId}/home`
- Right side: user name + avatar + dropdown menu (theme, switch user, mistakes, logout)
- Avatar: `userId === 'cyan'` → `/avatar-cyan.jpg`, `userId === 'ryan'` → `/avatar-ryan.jpg`, else `/avatar-parent.jpg`
- User name: `userId === 'cyan'` → '彤彤', `userId === 'ryan'` → '可可', else userId
- The entire dropdown menu (switch user, theme, mistakes, logout) should be in this component
- Must handle the case where **userId is undefined** gracefully — if userId is falsy, redirect to `/` or show a safe fallback (don't render "undefined")

**Copy the header code from current DailyView.tsx** (it has the complete menu with theme switcher, user switcher, mistakes link, logout). Make sure to include all imports (lucide icons, theme utils, logout, useNavigate, useState, useEffect, useRef).

## 2. Replace Headers in ALL Pages

Replace the inline header in each page with `<Header userId={userId} />`:

- `src/pages/Home.tsx` — delete the entire header section + menu state + menu logic, use `<Header>`
- `src/pages/DailyView.tsx` — same
- `src/pages/DailyQuiz.tsx` — same (it has 3 different headers for loading/empty/normal states — use `<Header>` in all 3)
- `src/pages/ParentDashboard.tsx` — use `<Header userId="parent" />`
- `src/pages/Quiz.tsx` — this one is different (has back button + quiz title). Keep its own header but replace the logo img tags with a clickable logo that navigates to `/${userId}/home`. Don't use the full Header component here since the layout is different.

## 3. Fix `/cyan/today` navigate from Home "历史记录" card

Current: Home's "历史记录" card navigates to `/${userId}/today`.
Problem: When navigating, DailyView gets userId from useParams. But the route `/:userId/today` should work — the issue is actually that Home passes undefined userId somewhere.

**Check**: In Home.tsx, the navigate call should be `` navigate(`/${userId}/today`) ``. Make sure `userId` from useParams is not undefined. If the Home route is `/:userId/home`, userId should be captured. Verify this.

**Also fix**: The route `/cyan` currently maps to `<Home />` but Home uses `useParams<{ userId: string }>()`. The route `/cyan` has no `:userId` param — it's a literal path. So `userId` will be undefined!

**Fix**: Change App.tsx routes from literal `/cyan` and `/ryan` to use a redirect or pass userId properly:
```tsx
// Option A: Navigate/redirect
<Route path="/cyan" element={<Navigate to="/cyan/home" replace />} />
<Route path="/ryan" element={<Navigate to="/ryan/home" replace />} />
```

## 4. Run `npm run build` to verify

No errors allowed. All pages must use the shared Header.

## Rules
- Do NOT change Quiz.tsx layout (just make logo clickable)
- Do NOT change Mistakes.tsx or Result.tsx
- Do NOT change any API files
- The Header component must handle userId gracefully (no "undefined" text)

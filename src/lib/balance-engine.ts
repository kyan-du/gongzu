// Balance Scale Sorting — Pure algorithmic puzzle generator

export type BalanceDifficulty = 'easy' | 'medium' | 'hard';
export type SortDirection = 'heavy-to-light' | 'light-to-heavy';

export interface BalanceComparison {
  left: string;   // emoji
  right: string;  // emoji
  heavier: 'left' | 'right';
}

export interface BalancePuzzle {
  items: string[];                    // all emojis used (sorted heaviest→lightest)
  comparisons: BalanceComparison[];   // clues shown to the player
  options: string[][];                // 6 orderings in the requested direction
  correctIndex: number;               // index into shuffled options
  difficulty: BalanceDifficulty;
  direction: SortDirection;           // what the player is asked to do
  category: string;                   // e.g. "fruits"
  answerStyle: 'emoji' | 'numbered';
  numberMap?: Record<string, number>; // emoji → assigned number (random mapping, only for 'numbered')
}

// ── Emoji categories ──

const CATEGORIES: { name: string; emojis: string[] }[] = [
  { name: 'fruits',    emojis: ['🍎', '🍐', '🍉', '🍌', '🍊', '🍇'] },
  { name: 'animals',   emojis: ['🐱', '🐶', '🐰', '🐸', '🐷', '🐵'] },
  { name: 'balls',     emojis: ['⚽', '🏀', '🎾', '🏐', '🎱', '🏈'] },
  { name: 'transport', emojis: ['🚗', '🚌', '🚁', '✈️', '🚀', '🚂'] },
  { name: 'flowers',   emojis: ['🌸', '🌻', '🌹', '🌺', '🌼', '💐'] },
  { name: 'nature',    emojis: ['⭐', '🌙', '☀️', '🌈', '❄️', '🔥'] },
];

// ── Helpers ──

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate comparisons from a known ordering (heaviest→lightest).
 * We select pairs that form a solvable set of clues.
 */
function generateComparisons(
  ordering: string[],
  count: number,
): BalanceComparison[] {
  const n = ordering.length;

  // Always include adjacent pairs (the "chain") — these are necessary for unique solution
  const adjacent: BalanceComparison[] = [];
  for (let i = 0; i < n - 1; i++) {
    adjacent.push({
      left: ordering[i],
      right: ordering[i + 1],
      heavier: 'left',
    });
  }

  // If we need more comparisons than adjacent pairs, add some redundant non-adjacent ones
  const extra: BalanceComparison[] = [];
  if (count > adjacent.length) {
    const nonAdjacentPairs: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j++) {
        nonAdjacentPairs.push([i, j]);
      }
    }
    const shuffled = shuffle(nonAdjacentPairs);
    for (let k = 0; k < Math.min(count - adjacent.length, shuffled.length); k++) {
      const [i, j] = shuffled[k];
      extra.push({
        left: ordering[i],
        right: ordering[j],
        heavier: 'left',
      });
    }
  }

  // Take `count` comparisons: prioritize all adjacent, then extras
  let comparisons = [...adjacent, ...extra].slice(0, count);

  // Randomly swap left/right presentation (heavier stays correct)
  comparisons = comparisons.map((c) => {
    if (Math.random() < 0.5) {
      return { left: c.right, right: c.left, heavier: 'right' as const };
    }
    return c;
  });

  return shuffle(comparisons);
}

/**
 * Generate plausible distractor orderings.
 * Strategy: swap adjacent/nearby pairs to create near-miss permutations.
 */
function generateDistractors(correct: string[], count: number): string[][] {
  const distractors: string[][] = [];
  const seen = new Set<string>();
  seen.add(correct.join(','));

  const attempts = count * 20;
  for (let attempt = 0; attempt < attempts && distractors.length < count; attempt++) {
    const perm = [...correct];

    // Strategy mix: 1 swap, 2 swaps, or reverse a segment
    const strategy = Math.random();
    if (strategy < 0.4) {
      // Single adjacent swap
      const i = Math.floor(Math.random() * (perm.length - 1));
      [perm[i], perm[i + 1]] = [perm[i + 1], perm[i]];
    } else if (strategy < 0.7) {
      // Two swaps
      for (let s = 0; s < 2; s++) {
        const i = Math.floor(Math.random() * (perm.length - 1));
        [perm[i], perm[i + 1]] = [perm[i + 1], perm[i]];
      }
    } else if (strategy < 0.85) {
      // Reverse a sub-segment of length 2-3
      const len = 2 + Math.floor(Math.random() * 2);
      const start = Math.floor(Math.random() * (perm.length - len + 1));
      const seg = perm.slice(start, start + len).reverse();
      for (let k = 0; k < len; k++) perm[start + k] = seg[k];
    } else {
      // Random swap of any two positions
      const i = Math.floor(Math.random() * perm.length);
      let j = Math.floor(Math.random() * perm.length);
      while (j === i) j = Math.floor(Math.random() * perm.length);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    const key = perm.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      distractors.push(perm);
    }
  }

  // If still not enough (very rare), just do random shuffles
  while (distractors.length < count) {
    const perm = shuffle([...correct]);
    const key = perm.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      distractors.push(perm);
    }
  }

  return distractors;
}

// ── Validator: check that an ordering satisfies all comparisons ──

function satisfiesAllComparisons(
  ordering: string[],
  comparisons: BalanceComparison[],
): boolean {
  // Build weight map: ordering[0] is heaviest (weight = N-1), last is lightest (weight = 0)
  const weight = new Map<string, number>();
  for (let i = 0; i < ordering.length; i++) {
    weight.set(ordering[i], ordering.length - 1 - i);
  }
  for (const c of comparisons) {
    const heavierEmoji = c.heavier === 'left' ? c.left : c.right;
    const lighterEmoji = c.heavier === 'left' ? c.right : c.left;
    const hw = weight.get(heavierEmoji);
    const lw = weight.get(lighterEmoji);
    if (hw === undefined || lw === undefined || hw <= lw) return false;
  }
  return true;
}

// ── Main generator ──

export function generateBalancePuzzle(difficulty: BalanceDifficulty, direction?: SortDirection): BalancePuzzle {
  // Randomly pick direction if not specified
  const dir: SortDirection = direction ?? (Math.random() < 0.5 ? 'heavy-to-light' : 'light-to-heavy');
  // Pick category
  const category = pickRandom(CATEGORIES);

  // Determine item count and comparison count
  let itemCount: number;
  let compCount: number;
  switch (difficulty) {
    case 'easy':
      itemCount = 4;
      compCount = 4;
      break;
    case 'medium':
      itemCount = 5;
      compCount = 4 + Math.floor(Math.random() * 2); // 4-5
      break;
    case 'hard':
      itemCount = 6;
      compCount = 5;
      break;
  }

  // Pick and shuffle emojis (the shuffle IS the secret ordering)
  const items = shuffle([...category.emojis]).slice(0, itemCount);
  // items[0] is heaviest, items[last] is lightest

  const comparisons = generateComparisons(items, compCount);
  const distractors = generateDistractors(items, 5);

  // If light-to-heavy, reverse the correct answer and all distractors
  const correctOrder = dir === 'light-to-heavy' ? [...items].reverse() : items;
  const orientedDistractors = distractors.map(d =>
    dir === 'light-to-heavy' ? [...d].reverse() : d
  );

  // ── Validate: exactly one option satisfies all comparisons ──
  // Correct order (heavy-to-light) must pass; all distractors must fail
  // If a distractor accidentally satisfies (shouldn't happen with full chain), regenerate
  const validDistractors = orientedDistractors.filter(d => {
    // Check against heavy-to-light ordering (the canonical direction)
    const htl = dir === 'light-to-heavy' ? [...d].reverse() : d;
    return !satisfiesAllComparisons(htl, comparisons);
  });

  // If we lost some distractors, regenerate extras
  while (validDistractors.length < 5) {
    const perm = shuffle([...correctOrder]);
    const htl = dir === 'light-to-heavy' ? [...perm].reverse() : perm;
    if (
      perm.join(',') !== correctOrder.join(',') &&
      !validDistractors.some(d => d.join(',') === perm.join(',')) &&
      !satisfiesAllComparisons(htl, comparisons)
    ) {
      validDistractors.push(perm);
    }
  }

  // Build options: correct + 5 validated distractors, then shuffle
  const allOptions = [correctOrder, ...validDistractors.slice(0, 5)];
  const shuffledOptions = shuffle(allOptions.map((opt, idx) => ({ opt, idx })));
  const correctIndex = shuffledOptions.findIndex((o) => o.idx === 0);

  // Randomly pick answer style
  const answerStyle: 'emoji' | 'numbered' = Math.random() < 0.5 ? 'emoji' : 'numbered';

  // Generate random number mapping for numbered style
  let numberMap: Record<string, number> | undefined;
  if (answerStyle === 'numbered') {
    const numbers = shuffle(Array.from({ length: itemCount }, (_, i) => i + 1));
    numberMap = {};
    for (let i = 0; i < items.length; i++) {
      numberMap[items[i]] = numbers[i];
    }
  }

  return {
    items,
    comparisons,
    options: shuffledOptions.map((o) => o.opt),
    correctIndex,
    difficulty,
    direction: dir,
    category: category.name,
    answerStyle,
    numberMap,
  };
}

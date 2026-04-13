// Equivalence Substitution — Pure algorithmic puzzle generator

export type EquivDifficulty = 'easy' | 'medium' | 'hard';

export interface EquivEquation {
  left: string[];   // emojis on the left side of the balanced scale
  right: string[];  // emojis on the right side of the balanced scale
}

export type EquivDisplayStyle = 'scale' | 'equation';

export interface EquivPuzzle {
  equations: EquivEquation[];     // clue equations shown as balanced scales
  question: { item: string; targetItem: string };  // "How many targetItem equal one item?"
  answer: number;                  // correct answer
  options: number[];               // 6 shuffled answer choices
  correctIndex: number;            // index in options
  difficulty: EquivDifficulty;
  category: string;
  displayStyle: EquivDisplayStyle; // visual presentation style
}

// ── Emoji categories ──

const CATEGORIES: { name: string; emojis: string[] }[] = [
  { name: 'fruits',    emojis: ['🍎', '🍐', '🍉', '🍌', '🍊', '🍇', '🍓', '🫐'] },
  { name: 'animals',   emojis: ['🐱', '🐶', '🐰', '🐸', '🐷', '🐵', '🐻', '🦊'] },
  { name: 'balls',     emojis: ['⚽', '🏀', '🎾', '🏐', '🎱', '🏈', '🥎', '🏓'] },
  { name: 'flowers',   emojis: ['🌸', '🌻', '🌹', '🌺', '🌼', '💐', '🌷', '🪻'] },
  { name: 'nature',    emojis: ['⭐', '🌙', '☀️', '🌈', '❄️', '🔥', '💧', '🍀'] },
  { name: 'food',      emojis: ['🍩', '🍪', '🧁', '🍰', '🍫', '🍬', '🍭', '🍮'] },
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
 * Generate wrong answer options that are plausible near-misses.
 * Returns exactly `count` unique wrong answers (all positive integers, all != correctAnswer).
 */
function generateWrongAnswers(correctAnswer: number, count: number): number[] {
  const wrongs = new Set<number>();

  // Near misses: ±1, ±2, ±3
  for (const delta of [1, -1, 2, -2, 3, -3]) {
    const v = correctAnswer + delta;
    if (v > 0 && v !== correctAnswer) wrongs.add(v);
  }

  // Multiplicative near misses: *2, /2, *3
  for (const factor of [2, 3]) {
    const v = correctAnswer * factor;
    if (v > 0 && v !== correctAnswer) wrongs.add(v);
    if (correctAnswer % factor === 0) {
      const d = correctAnswer / factor;
      if (d > 0 && d !== correctAnswer) wrongs.add(d);
    }
  }

  // Fill with random nearby values if needed
  let offset = 4;
  while (wrongs.size < count) {
    const v = correctAnswer + offset;
    if (v > 0 && v !== correctAnswer) wrongs.add(v);
    const v2 = correctAnswer - offset;
    if (v2 > 0 && v2 !== correctAnswer) wrongs.add(v2);
    offset++;
  }

  // Take exactly `count` and shuffle
  return shuffle([...wrongs].slice(0, count));
}

// ── Easy puzzle: 2 equations, two-step chain with small numbers ──
// e.g. 🍎 = 🍊🍊, 🍊 = 🍌🍌, question: 🍎 = ?🍌 (answer: 4)

function generateEasy(emojis: string[]): { equations: EquivEquation[]; question: { item: string; targetItem: string }; answer: number } {
  const [a, b, c] = emojis;

  // 1 A = p B, 1 B = q C → 1 A = p*q C
  // Constraint: p*q ≤ 8, p >= 2, q >= 2
  const pairs: [number, number][] = [];
  for (let p = 2; p <= 4; p++) {
    for (let q = 2; q <= 4; q++) {
      if (p * q <= 8) pairs.push([p, q]);
    }
  }
  const [p, q] = pickRandom(pairs);

  const equations: EquivEquation[] = [
    { left: [a], right: Array(p).fill(b) },
    { left: [b], right: Array(q).fill(c) },
  ];

  return {
    equations,
    question: { item: a, targetItem: c },
    answer: p * q,
  };
}

// ── Medium puzzle: substitution required (mixed items on one side) ──
// Pattern 1: A+B = nC,  A = mC  → B = (n-m)C
// Pattern 2: nA = B+mC, A = pC  → B = (n*p - m)C

function generateMedium(emojis: string[]): { equations: EquivEquation[]; question: { item: string; targetItem: string }; answer: number } {
  const [a, b, c] = emojis;
  const pattern = Math.random();

  if (pattern < 0.5) {
    // Pattern 1: A + B = nC, A = mC → B = (n-m)C
    // m in [2..4], answer(n-m) in [2..6], so n = m + answer
    const m = 2 + Math.floor(Math.random() * 3); // 2-4
    const ans = 2 + Math.floor(Math.random() * 5); // 2-6
    const n = m + ans;
    return {
      equations: [
        { left: [a, b], right: Array(n).fill(c) },
        { left: [a], right: Array(m).fill(c) },
      ],
      question: { item: b, targetItem: c },
      answer: ans,
    };
  } else {
    // Pattern 2: A = nB, A + C = mB → C = (m-n)B
    const n = 2 + Math.floor(Math.random() * 3); // 2-4
    const ans = 2 + Math.floor(Math.random() * 4); // 2-5
    const m = n + ans;
    return {
      equations: [
        { left: [a], right: Array(n).fill(b) },
        { left: [a, c], right: Array(m).fill(b) },
      ],
      question: { item: c, targetItem: b },
      answer: ans,
    };
  }
}

// ── Hard puzzle: 3 equations with substitution + chain ──
// Pattern 1: A = pB, B + C = qD, A = rD → C = (q - r/p)D (needs multi-step)
// Pattern 2: A + B = nC, A = mC, B = pD → D = ? C (chain + substitution)
// Pattern 3: A = pB, C = qB, A + C = ?B (additive after resolving)

function generateHard(emojis: string[]): { equations: EquivEquation[]; question: { item: string; targetItem: string }; answer: number } {
  const [a, b, c, d] = emojis;
  const pattern = Math.random();

  if (pattern < 0.33) {
    // Pattern: A = pB, B = qC, A + D = nC → D = (n - p*q)C
    const p = 2 + Math.floor(Math.random() * 2); // 2-3
    const q = 2 + Math.floor(Math.random() * 2); // 2-3
    const ans = 2 + Math.floor(Math.random() * 5); // 2-6
    const n = p * q + ans; // total on right
    return {
      equations: [
        { left: [a], right: Array(p).fill(b) },
        { left: [b], right: Array(q).fill(c) },
        { left: [a, d], right: Array(n).fill(c) },
      ],
      question: { item: d, targetItem: c },
      answer: ans,
    };
  } else if (pattern < 0.66) {
    // Pattern: A + B = nC, A = mC, B = pD → find D = ?C
    // B = (n-m)C, B = pD → D = (n-m)/p C. Need (n-m) divisible by p.
    const m = 2 + Math.floor(Math.random() * 3); // 2-4
    const p = 2 + Math.floor(Math.random() * 2); // 2-3
    const dVal = 2 + Math.floor(Math.random() * 3); // 2-4 (answer)
    const bVal = p * dVal;
    const n = m + bVal;
    return {
      equations: [
        { left: [a, b], right: Array(n).fill(c) },
        { left: [a], right: Array(m).fill(c) },
        { left: [b], right: Array(p).fill(d) },
      ],
      question: { item: d, targetItem: c },
      answer: dVal,
    };
  } else {
    // Pattern: A = pC, B = qC, A + B = ?C (need to add after resolving each)
    const p = 2 + Math.floor(Math.random() * 4); // 2-5
    const q = 2 + Math.floor(Math.random() * 4); // 2-5
    const ans = p + q;
    // Show two equations + the combined question differently:
    // Eq1: A = pC, Eq2: B = qC, Eq3: A + B = nD, D = ?C → nah, keep it simpler
    // Just ask: A + B = ?C
    return {
      equations: [
        { left: [a], right: Array(p).fill(c) },
        { left: [b], right: Array(q).fill(c) },
      ],
      question: { item: `${a}${b}`, targetItem: c },
      answer: ans,
    };
  }
}

// ── Main generator ──

export function generateEquivPuzzle(difficulty: EquivDifficulty): EquivPuzzle {
  const category = pickRandom(CATEGORIES);
  const shuffledEmojis = shuffle([...category.emojis]);

  let result: { equations: EquivEquation[]; question: { item: string; targetItem: string }; answer: number };

  switch (difficulty) {
    case 'easy':
      result = generateEasy(shuffledEmojis);
      break;
    case 'medium':
      result = generateMedium(shuffledEmojis);
      break;
    case 'hard':
      result = generateHard(shuffledEmojis);
      break;
  }

  const { equations, question, answer } = result;

  // Shuffle equation order for medium/hard to make it less obvious
  const shuffledEquations = difficulty === 'easy' ? equations : shuffle(equations);

  // Generate 5 wrong answers + correct, shuffle
  const wrongAnswers = generateWrongAnswers(answer, 5);
  const allOptions = [answer, ...wrongAnswers];
  const shuffledOptions = shuffle(allOptions.map((val, idx) => ({ val, idx })));
  const correctIndex = shuffledOptions.findIndex((o) => o.idx === 0);

  // Randomly pick display style
  const displayStyle: EquivDisplayStyle = Math.random() < 0.5 ? 'scale' : 'equation';

  return {
    equations: shuffledEquations,
    question,
    answer,
    options: shuffledOptions.map((o) => o.val),
    correctIndex,
    difficulty,
    category: category.name,
    displayStyle,
  };
}

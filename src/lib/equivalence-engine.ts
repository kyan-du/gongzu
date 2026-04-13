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

// ── Medium puzzle: 2 equations with bigger numbers, or 3 equations with small numbers ──
// e.g. 🍎 = 🍊🍊🍊, 🍊 = 🍌🍌🍌, question: 🍎 = ?🍌 (answer: 9)

function generateMedium(emojis: string[]): { equations: EquivEquation[]; question: { item: string; targetItem: string }; answer: number } {
  // 50% chance: 2-equation with bigger range, 50% chance: 3-equation with small numbers
  if (Math.random() < 0.5) {
    // 2-equation, answer 9-12
    const [a, b, c] = emojis;
    const pairs: [number, number][] = [];
    for (let p = 2; p <= 6; p++) {
      for (let q = 2; q <= 6; q++) {
        if (p * q >= 9 && p * q <= 12) pairs.push([p, q]);
      }
    }
    const [p, q] = pickRandom(pairs);
    return {
      equations: [
        { left: [a], right: Array(p).fill(b) },
        { left: [b], right: Array(q).fill(c) },
      ],
      question: { item: a, targetItem: c },
      answer: p * q,
    };
  } else {
    // 3-equation chain, answer ≤ 12
    const [a, b, c, d] = emojis;
    const triples: [number, number, number][] = [];
    for (let p = 2; p <= 3; p++) {
      for (let q = 2; q <= 3; q++) {
        for (let r = 2; r <= 3; r++) {
          if (p * q * r <= 12) triples.push([p, q, r]);
        }
      }
    }
    const [p, q, r] = pickRandom(triples);
    return {
      equations: [
        { left: [a], right: Array(p).fill(b) },
        { left: [b], right: Array(q).fill(c) },
        { left: [c], right: Array(r).fill(d) },
      ],
      question: { item: a, targetItem: d },
      answer: p * q * r,
    };
  }
}

// ── Hard puzzle: 3 equations, three-step chain ──
// e.g. 🍎 = 🍊🍊, 🍊 = 🍌🍌, 🍌 = 🍇🍇, question: 🍎 = ?🍇 (answer: 8)

function generateHard(emojis: string[]): { equations: EquivEquation[]; question: { item: string; targetItem: string }; answer: number } {
  const [a, b, c, d] = emojis;

  // 1 A = p B, 1 B = q C, 1 C = r D → 1 A = p*q*r D
  // Constraint: p*q*r ≤ 20, each >= 2
  const triples: [number, number, number][] = [];
  for (let p = 2; p <= 5; p++) {
    for (let q = 2; q <= 5; q++) {
      for (let r = 2; r <= 5; r++) {
        if (p * q * r <= 20) triples.push([p, q, r]);
      }
    }
  }
  const [p, q, r] = pickRandom(triples);

  const equations: EquivEquation[] = [
    { left: [a], right: Array(p).fill(b) },
    { left: [b], right: Array(q).fill(c) },
    { left: [c], right: Array(r).fill(d) },
  ];

  return {
    equations,
    question: { item: a, targetItem: d },
    answer: p * q * r,
  };
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

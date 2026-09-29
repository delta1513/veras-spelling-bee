import type { Difficulty, DifficultyConfig, Slot } from "./types";

/**
 * One word per letter of the alphabet. Every word has a matching ARASAAC
 * pictogram in public/pictograms/{word}.png.
 */
export const ALL_WORDS = [
  "apple",
  "ball",
  "bee",
  "cat",
  "dog",
  "duck",
  "egg",
  "fish",
  "frog",
  "girl",
  "hat",
  "island",
  "jam",
  "key",
  "leaf",
  "moon",
  "nose",
  "orange",
  "pig",
  "queen",
  "rain",
  "sun",
  "tree",
  "umbrella",
  "van",
  "water",
  "xylophone",
  "yogurt",
  "zebra",
] as const;

const EASY_WORDS = [
  "cat",
  "dog",
  "sun",
  "hat",
  "key",
  "bee",
  "egg",
  "jam",
  "pig",
  "van",
] as const;
const MEDIUM_WORDS = [
  "ball",
  "fish",
  "moon",
  "tree",
  "nose",
  "girl",
  "leaf",
  "rain",
  "duck",
  "frog",
] as const;

/** The 16 words not used by easy or medium, in alphabetical order. */
const SHORT_WORDS = new Set<string>([...EASY_WORDS, ...MEDIUM_WORDS]);
const HARD_WORDS: readonly string[] = ALL_WORDS.filter(
  (word) => !SHORT_WORDS.has(word),
);

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    words: EASY_WORDS,
    lives: 5,
    livesScope: "word",
    blanks: () => 1,
    keepFirstLetter: false,
  },
  medium: {
    words: MEDIUM_WORDS,
    lives: 4,
    livesScope: "word",
    blanks: (length) => Math.ceil(0.25 * length),
    keepFirstLetter: false,
  },
  hard: {
    words: HARD_WORDS,
    lives: 3,
    livesScope: "round",
    blanks: (length) => Math.ceil(0.5 * length),
    keepFirstLetter: false,
  },
  expert: {
    words: ALL_WORDS,
    lives: 1,
    livesScope: "round",
    // Every letter except the first.
    blanks: (length) => length - 1,
    keepFirstLetter: true,
  },
};

export const DIFFICULTY_ORDER: readonly Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
];

/** Deterministic 32-bit hash so a word always produces the same puzzle. */
function hashWord(word: string): number {
  let hash = 2166136261;
  for (let i = 0; i < word.length; i++) {
    hash ^= word.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — small seeded PRNG, enough for picking blank positions. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates, using whichever random source is handed in. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * The words for one round, shuffled. A fresh order every round keeps the game
 * from becoming a rote sequence she can finish without looking at the pictures.
 *
 * Passing a `seed` makes the order reproducible, which is what the end-to-end
 * tests use; without one the order is genuinely random.
 */
export function roundWords(difficulty: Difficulty, seed?: number): string[] {
  const words = DIFFICULTIES[difficulty].words;
  const random =
    seed === undefined
      ? Math.random
      : seededRandom(hashWord(`${difficulty}:${seed}`));
  return shuffle(words, random);
}

/**
 * Which letter positions are hidden, chosen fresh every time the word comes up.
 * The same word will present a different puzzle on each encounter, so it has to
 * be spelled rather than recalled as a shape.
 *
 * Any letter can be hidden, including the first — except on expert, which keeps
 * the first letter as an anchor and hides all the rest.
 */
export function blankPositions(word: string, difficulty: Difficulty): number[] {
  const config = DIFFICULTIES[difficulty];
  const first = config.keepFirstLetter ? 1 : 0;
  const candidates = Array.from(
    { length: word.length - first },
    (_, i) => i + first,
  );
  const count = Math.min(
    Math.max(config.blanks(word.length), 1),
    candidates.length,
  );

  if (count === candidates.length) return candidates;

  // Take `count` positions at random, then put them back in reading order.
  return shuffle(candidates, Math.random)
    .slice(0, count)
    .sort((a, b) => a - b);
}

/** Build the fresh, unfilled slots for a word. */
export function buildSlots(word: string, difficulty: Difficulty): Slot[] {
  const blanks = new Set(blankPositions(word, difficulty));
  return [...word].map((letter, index) => ({
    letter,
    blank: blanks.has(index),
    filled: false,
  }));
}

/** Index of the slot the arrow points at, or -1 when the word is complete. */
export function cursorIndex(slots: Slot[]): number {
  return slots.findIndex((slot) => slot.blank && !slot.filled);
}

/** The letter the player needs next, or null when the word is complete. */
export function expectedLetter(slots: Slot[]): string | null {
  const index = cursorIndex(slots);
  return index === -1 ? null : slots[index].letter;
}

export function isWordComplete(slots: Slot[]): boolean {
  return cursorIndex(slots) === -1;
}

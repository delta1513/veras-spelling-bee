export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type LivesScope = "word" | "round";

export interface DifficultyConfig {
  /** Words played in one round. */
  words: readonly string[];
  /** How many lives the player starts with. */
  lives: number;
  /** "word" refills lives on every new word, "round" spends one pool across the round. */
  livesScope: LivesScope;
  /** How many letters to hide, given the word's length. */
  blanks: (length: number) => number;
  /**
   * When true the first letter is never hidden, so it anchors the word.
   * Only expert does this; everywhere else any letter can be blanked.
   */
  keepFirstLetter: boolean;
}

/** One letter position in the word being spelled. */
export interface Slot {
  letter: string;
  /** True when the letter starts hidden and must be typed. */
  blank: boolean;
  /** True once the player has typed this blank correctly. */
  filled: boolean;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSpeakLetter } from "@/lib/speech";
import type { Difficulty, Slot } from "@/lib/types";
import {
  DIFFICULTIES,
  buildSlots,
  cursorIndex,
  isWordComplete,
  roundWords,
} from "@/lib/words";
import FailOverlay from "./FailOverlay";
import Keyboard from "./Keyboard";
import RoundComplete from "./RoundComplete";
import SuccessOverlay from "./SuccessOverlay";
import WordDisplay from "./WordDisplay";
import { HeartIcon, HomeIcon, LightbulbIcon, SpeakerIcon } from "./icons";

/** How many times the lightbulb can be tapped for each word. */
const MAX_HINTS = 3;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

type Phase = "playing" | "wordComplete" | "roundComplete" | "gameOver";

interface State {
  /** This round's words, in the order they will be played. */
  words: string[];
  wordIndex: number;
  slots: Slot[];
  wrongLetters: string[];
  /** Keys the lightbulb has greyed out for this word. */
  hintedLetters: string[];
  hintsUsed: number;
  lives: number;
  phase: Phase;
}

/**
 * `?seed=<number>` fixes the word order so a round can be replayed exactly.
 * The end-to-end tests rely on it; ordinary play leaves it off and gets a
 * genuinely random order.
 */
function seedFromUrl(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = new URLSearchParams(window.location.search).get("seed");
  if (raw === null) return undefined;
  const seed = Number(raw);
  return Number.isFinite(seed) ? seed : undefined;
}

function startRound(difficulty: Difficulty): State {
  const config = DIFFICULTIES[difficulty];
  const words = roundWords(difficulty, seedFromUrl());
  return {
    words,
    wordIndex: 0,
    slots: buildSlots(words[0], difficulty),
    wrongLetters: [],
    hintedLetters: [],
    hintsUsed: 0,
    lives: config.lives,
    phase: "playing",
  };
}

export default function Game({
  difficulty,
  onHome,
}: {
  difficulty: Difficulty;
  onHome: () => void;
}) {
  const config = DIFFICULTIES[difficulty];
  const [state, setState] = useState<State>(() => startRound(difficulty));
  const [shake, setShake] = useState(false);

  const word = state.words[state.wordIndex];
  const greyedKeys = useMemo(
    () => new Set([...state.wrongLetters, ...state.hintedLetters]),
    [state.wrongLetters, state.hintedLetters],
  );
  const hintsLeft = MAX_HINTS - state.hintsUsed;
  const { supported: canSpeak, speaking, speak, stop } = useSpeakLetter();
  const cursor = cursorIndex(state.slots);
  const neededLetter = cursor === -1 ? undefined : state.slots[cursor].letter;

  // Stop talking once the letter she was told about is no longer the one needed.
  useEffect(() => stop, [state.wordIndex, cursor, state.phase, stop]);

  const handleSpeak = useCallback(() => {
    if (state.phase === "playing" && neededLetter) speak(neededLetter);
  }, [state.phase, neededLetter, speak]);

  const handlePress = useCallback(
    (letter: string) => {
      const current = cursorIndex(state.slots);
      const wrong =
        state.phase === "playing" &&
        current !== -1 &&
        state.slots[current].letter !== letter;

      setState((previous) => {
        if (previous.phase !== "playing") return previous;

        const cursor = cursorIndex(previous.slots);
        if (cursor === -1) return previous;

        if (previous.slots[cursor].letter === letter) {
          const slots = previous.slots.map((slot, index) =>
            index === cursor ? { ...slot, filled: true } : slot,
          );
          return {
            ...previous,
            slots,
            phase: isWordComplete(slots) ? "wordComplete" : "playing",
          };
        }

        if (previous.wrongLetters.includes(letter)) return previous;

        const lives = previous.lives - 1;
        return {
          ...previous,
          wrongLetters: [...previous.wrongLetters, letter],
          lives,
          phase: lives <= 0 ? "gameOver" : "playing",
        };
      });

      if (wrong) {
        setShake(true);
        window.setTimeout(() => setShake(false), 350);
      }
    },
    [state],
  );

  const handleHint = useCallback(() => {
    setState((previous) => {
      if (previous.phase !== "playing" || previous.hintsUsed >= MAX_HINTS) {
        return previous;
      }

      const taken = new Set([
        ...previous.wrongLetters,
        ...previous.hintedLetters,
      ]);
      const available = [...ALPHABET].filter((letter) => !taken.has(letter));
      // Never grey a letter the word still needs, or the hint could trap her.
      const needed = new Set(
        previous.slots
          .filter((slot) => slot.blank && !slot.filled)
          .map((slot) => slot.letter),
      );
      const candidates = available.filter((letter) => !needed.has(letter));

      // Fisher-Yates, then take half of the keys that are still live.
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      const greyed = candidates.slice(0, Math.ceil(available.length / 2));

      return {
        ...previous,
        hintedLetters: [...previous.hintedLetters, ...greyed],
        hintsUsed: previous.hintsUsed + 1,
      };
    });
  }, []);

  const handleNext = useCallback(() => {
    setState((previous) => {
      const nextIndex = previous.wordIndex + 1;
      if (nextIndex >= previous.words.length) {
        return { ...previous, phase: "roundComplete" };
      }
      return {
        ...previous,
        wordIndex: nextIndex,
        slots: buildSlots(previous.words[nextIndex], difficulty),
        wrongLetters: [],
        hintedLetters: [],
        hintsUsed: 0,
        // Easy and medium hand back a full set of lives for every new word;
        // hard and expert spend one pool across the whole round.
        lives: config.livesScope === "word" ? config.lives : previous.lives,
        phase: "playing",
      };
    });
  }, [config, difficulty]);

  const handleRestart = useCallback(() => {
    setState(startRound(difficulty));
  }, [difficulty]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-3 py-3 roomy:max-w-3xl roomy:gap-4 roomy:px-6 spacious:max-w-5xl spacious:gap-2 spacious:py-2">
      <header className="flex items-center justify-between">
        <button
          type="button"
          data-testid="btn-home"
          aria-label="home"
          onClick={onHome}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm active:translate-y-0.5 roomy:h-16 roomy:w-16"
        >
          <HomeIcon className="h-7 w-7 roomy:h-10 roomy:w-10" />
        </button>

        <div
          className="flex gap-1 roomy:gap-2"
          data-testid="lives"
          data-lives={state.lives}
        >
          {Array.from({ length: config.lives }, (_, index) => (
            <HeartIcon
              key={index}
              full={index < state.lives}
              className="h-8 w-8 roomy:h-11 roomy:w-11"
            />
          ))}
        </div>
      </header>

      <div
        className="flex flex-wrap justify-center gap-1.5"
        data-testid="progress"
        data-progress={state.wordIndex}
        aria-hidden="true"
      >
        {state.words.map((_, index) => (
          <span
            key={index}
            data-testid={`progress-dot-${index}`}
            data-done={index < state.wordIndex ? "true" : "false"}
            className={`h-2.5 w-2.5 rounded-full ${
              index < state.wordIndex
                ? "bg-[color:var(--color-go)]"
                : index === state.wordIndex
                  ? "bg-[color:var(--color-honey-deep)]"
                  : "bg-black/15"
            }`}
          />
        ))}
      </div>

      {/* Picture and word stay centred in whatever space the keyboard leaves. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        {/* Pictograms have mixed backgrounds, so each sits on its own white card.
            Landscape keeps the picture a little smaller than portrait: there is
            plenty of width there but much less height to share with the keyboard. */}
        {/* Picture stays centred; the hint sits in the free space on its right. */}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <span />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={word}
            src={`/pictograms/${word}.png`}
            alt={word}
            width={220}
            height={220}
            data-testid="word-image"
            className="h-48 w-48 rounded-3xl bg-white object-contain p-2 shadow-sm roomy:h-60 roomy:w-60 spacious:h-44 spacious:w-44"
          />
          {/* Hint on top, speaker underneath: both in reach of one thumb. */}
          <div className="flex flex-col items-center justify-center gap-3 roomy:gap-4">
            <button
              type="button"
              data-testid="btn-hint"
              data-hints-left={hintsLeft}
              aria-label="hint"
              disabled={hintsLeft <= 0 || state.phase !== "playing"}
              onClick={handleHint}
              className="flex h-24 w-16 flex-col items-center justify-center gap-1.5 rounded-full bg-white shadow-sm active:translate-y-0.5 disabled:opacity-60 roomy:h-36 roomy:w-24 spacious:h-28"
            >
              <LightbulbIcon
                lit={hintsLeft > 0}
                className="h-10 w-10 roomy:h-16 roomy:w-16"
              />
              <span className="flex gap-1" aria-hidden="true">
                {Array.from({ length: MAX_HINTS }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full roomy:h-3 roomy:w-3 ${
                      index < hintsLeft
                        ? "bg-[color:var(--color-honey-deep)]"
                        : "bg-black/15"
                    }`}
                  />
                ))}
              </span>
            </button>
            <button
              type="button"
              data-testid="btn-speak"
              data-speaking={speaking ? "true" : "false"}
              aria-label="say letter"
              disabled={!canSpeak || state.phase !== "playing"}
              onClick={handleSpeak}
              className={`flex h-20 w-16 items-center justify-center rounded-full bg-white shadow-sm active:translate-y-0.5 disabled:opacity-60 roomy:h-28 roomy:w-24 spacious:h-24 ${
                speaking
                  ? "animate-talk scale-110 ring-4 ring-[#4aa3df] transition-transform"
                  : "transition-transform"
              }`}
            >
              <SpeakerIcon
                speaking={speaking}
                className="h-10 w-10 roomy:h-16 roomy:w-16"
              />
            </button>
          </div>
        </div>

        <WordDisplay
          slots={state.slots}
          shake={shake && state.phase === "playing"}
          speaking={speaking}
        />
      </div>

      <Keyboard
        disabled={greyedKeys}
        onPress={handlePress}
        locked={state.phase !== "playing"}
      />

      {state.phase === "wordComplete" && (
        <SuccessOverlay word={word} onNext={handleNext} />
      )}
      {state.phase === "gameOver" && (
        <FailOverlay onRestart={handleRestart} onHome={onHome} />
      )}
      {state.phase === "roundComplete" && (
        <RoundComplete onReplay={handleRestart} onHome={onHome} />
      )}
    </main>
  );
}

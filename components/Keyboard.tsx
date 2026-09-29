"use client";

/** Wordle's QWERTY layout, which matches a phone keyboard closely enough to transfer. */
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;

export default function Keyboard({
  disabled,
  onPress,
  locked,
}: {
  /** Letters already tried and wrong for this word. */
  disabled: ReadonlySet<string>;
  onPress: (letter: string) => void;
  /** True while an overlay is up, so stray taps do nothing. */
  locked: boolean;
}) {
  return (
    <div
      className="flex w-full flex-col gap-1.5 roomy:gap-2.5 spacious:gap-3"
      data-testid="keyboard"
    >
      {ROWS.map((row) => (
        <div
          key={row}
          className="flex justify-center gap-1 roomy:gap-2 spacious:gap-2.5"
        >
          {[...row].map((letter) => {
            const isDisabled = disabled.has(letter);
            return (
              <button
                key={letter}
                type="button"
                data-testid={`key-${letter}`}
                data-disabled={isDisabled ? "true" : "false"}
                aria-label={letter}
                disabled={isDisabled || locked}
                onClick={() => onPress(letter)}
                className={[
                  // Deliberately lighter than the word tiles (font-black): the
                  // keys are things to press, the word is the thing being
                  // built, and matching weights made the two read as one.
                  "flex-1 rounded-lg font-medium uppercase shadow-sm active:translate-y-0.5",
                  "min-h-12 max-w-11 text-xl",
                  // Landscape keeps the portrait key height — it is already
                  // well over double the phone size, and the extra vertical
                  // room is needed for the picture.
                  "roomy:min-h-20 roomy:max-w-20 roomy:rounded-xl roomy:text-4xl",
                  "spacious:max-w-24 spacious:rounded-2xl spacious:text-5xl",
                  isDisabled
                    ? "bg-[#c9c2b8] text-[#8b8478]"
                    : "bg-white text-[color:var(--color-ink)]",
                ].join(" ")}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

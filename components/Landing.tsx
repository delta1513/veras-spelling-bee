"use client";

import type { Difficulty } from "@/lib/types";
import { DIFFICULTY_ORDER } from "@/lib/words";

/**
 * Difficulty is communicated by colour and by how many bees are on the button.
 * The words are there for whoever is helping, not for the player.
 */
const LEVEL_STYLES: Record<Difficulty, { bees: number; className: string }> = {
  easy: { bees: 1, className: "bg-[#5ec46f] border-[#3f9c50]" },
  medium: { bees: 2, className: "bg-[#ffc83d] border-[#d9a11e]" },
  hard: { bees: 3, className: "bg-[#f28c28] border-[#c96f14]" },
  expert: { bees: 4, className: "bg-[#e05252] border-[#b73b3b]" },
};

export default function Landing({
  onStart,
}: {
  onStart: (difficulty: Difficulty) => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-4 px-4 py-6 roomy:max-w-2xl roomy:gap-6">
      <h1 className="text-center text-3xl font-black tracking-tight text-[color:var(--color-ink)] roomy:text-5xl">
        Vera&apos;s Spelling Bee
      </h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pictograms/bee.png"
        alt="Bee"
        width={160}
        height={160}
        className="h-36 w-36 object-contain drop-shadow-sm roomy:h-48 roomy:w-48"
        data-testid="landing-bee"
      />

      <div className="flex w-full flex-col gap-3">
        {DIFFICULTY_ORDER.map((difficulty) => {
          const { bees, className } = LEVEL_STYLES[difficulty];
          return (
            <button
              key={difficulty}
              type="button"
              onClick={() => onStart(difficulty)}
              data-testid={`difficulty-${difficulty}`}
              aria-label={difficulty}
              className={`flex min-h-20 items-center justify-center gap-2 rounded-3xl border-b-8 px-4 text-4xl shadow-md active:translate-y-1 active:border-b-4 roomy:min-h-28 roomy:gap-4 ${className}`}
            >
              {Array.from({ length: bees }, (_, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={i}
                  src="/pictograms/bee.png"
                  alt=""
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain roomy:h-16 roomy:w-16"
                />
              ))}
            </button>
          );
        })}
      </div>

      <p className="mt-auto pt-4 text-center text-[10px] leading-snug text-[color:var(--color-ink)]/50">
        Pictograms by Sergio Palao for ARASAAC (arasaac.org), owned by Gobierno
        de Aragón, licensed CC BY-NC-SA.
      </p>
    </main>
  );
}

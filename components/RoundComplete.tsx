"use client";

import Overlay, { BigButton } from "./Overlay";
import type { Difficulty } from "@/lib/types";
import { LEVEL_STYLES } from "./Landing";
import { HomeIcon, RestartIcon, TrophyIcon } from "./icons";

export default function RoundComplete({
  difficulty,
  onReplay,
  onHome,
}: {
  difficulty: Difficulty;
  onReplay: () => void;
  onHome: () => void;
}) {
  const { bees, className } = LEVEL_STYLES[difficulty];
  return (
    <Overlay testId="overlay-round-complete" tint="rgba(255, 200, 61, 0.97)">
      <TrophyIcon className="animate-pop h-36 w-36" />

      {/* Same colour and bee count as the level button on the home screen. */}
      <div
        data-testid="won-difficulty"
        data-difficulty={difficulty}
        aria-label={difficulty}
        className={`flex items-center justify-center gap-2 rounded-3xl border-b-8 px-6 py-3 shadow-md ${className}`}
      >
        {Array.from({ length: bees }, (_, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={i}
            src="/pictograms/bee.png"
            alt=""
            width={52}
            height={52}
            className="h-12 w-12 object-contain"
          />
        ))}
      </div>
      <p className="text-2xl font-black capitalize text-[color:var(--color-ink)]">
        {difficulty}
      </p>

      <div className="flex items-center gap-6">
        <BigButton
          testId="btn-replay"
          label="play again"
          icon={<RestartIcon className="h-12 w-12" />}
          onClick={onReplay}
          className="border-[#3f9c50] bg-[color:var(--color-go)]"
        />
        <BigButton
          testId="btn-home-overlay"
          label="home"
          icon={<HomeIcon className="h-12 w-12" />}
          onClick={onHome}
          className="border-[#cfc6b6] bg-white"
        />
      </div>
    </Overlay>
  );
}

"use client";

import Overlay, { BigButton } from "./Overlay";
import { CheckIcon, PlayIcon } from "./icons";

export default function SuccessOverlay({
  word,
  onNext,
}: {
  word: string;
  onNext: () => void;
}) {
  return (
    <Overlay testId="overlay-success" tint="rgba(53, 177, 74, 0.96)">
      <CheckIcon className="animate-pop h-28 w-28" />

      {/* The picture and the finished word together: the reward is seeing them match. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/pictograms/${word}.png`}
        alt={word}
        width={140}
        height={140}
        className="h-32 w-32 rounded-2xl bg-white object-contain p-1"
      />
      <p className="text-4xl font-black uppercase tracking-widest text-white">
        {word}
      </p>

      <BigButton
        testId="btn-next"
        label="next"
        icon={<PlayIcon className="h-12 w-12" />}
        onClick={onNext}
        className="border-[#d9a11e] bg-[color:var(--color-honey)]"
      />
    </Overlay>
  );
}

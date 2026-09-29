"use client";

import type { Slot } from "@/lib/types";
import { cursorIndex } from "@/lib/words";
import { CursorArrowIcon } from "./icons";

/**
 * Long words (xylophone) have to shrink to stay on one line on a phone. A
 * tablet has the width to spare, so the tiles grow back there.
 */
function tileSize(length: number) {
  if (length > 7) {
    return {
      width: "w-8 roomy:w-16",
      box: "h-11 text-2xl roomy:h-20 roomy:text-5xl spacious:h-16 spacious:text-4xl",
    };
  }
  if (length > 5) {
    return {
      width: "w-10 roomy:w-20",
      box: "h-14 text-3xl roomy:h-24 roomy:text-6xl spacious:h-20 spacious:text-5xl",
    };
  }
  return {
    width: "w-12 roomy:w-24",
    box: "h-16 text-4xl roomy:h-28 roomy:text-7xl spacious:h-24 spacious:text-6xl",
  };
}

export default function WordDisplay({
  slots,
  shake,
}: {
  slots: Slot[];
  shake: boolean;
}) {
  const cursor = cursorIndex(slots);
  const { width, box } = tileSize(slots.length);

  return (
    <div className={shake ? "animate-shake" : undefined} data-testid="word">
      {/* The arrow track sits above the tiles so it can line up with one of them. */}
      <div className="flex justify-center gap-1 roomy:gap-2" aria-hidden="true">
        {slots.map((_, index) => (
          <div
            key={index}
            className={`flex h-7 justify-center roomy:h-10 spacious:h-8 ${width}`}
          >
            {index === cursor && (
              <span
                className="animate-bob"
                data-testid="cursor-arrow"
                data-cursor-index={index}
              >
                <CursorArrowIcon className="h-6 w-6 roomy:h-9 roomy:w-9" />
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1 roomy:gap-2">
        {slots.map((slot, index) => {
          const hidden = slot.blank && !slot.filled;
          const justFilled = slot.blank && slot.filled;
          return (
            <div
              key={index}
              data-testid={`tile-${index}`}
              data-blank={slot.blank ? "true" : "false"}
              data-filled={hidden ? "false" : "true"}
              className={[
                "flex items-center justify-center rounded-xl font-black uppercase",
                width,
                box,
                hidden
                  ? "border-4 border-dashed border-[color:var(--color-honey-deep)] bg-white"
                  : justFilled
                    ? "animate-pop bg-[color:var(--color-go)] text-white"
                    : "bg-white text-[color:var(--color-ink)] shadow-sm",
              ].join(" ")}
            >
              {hidden ? "" : slot.letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}

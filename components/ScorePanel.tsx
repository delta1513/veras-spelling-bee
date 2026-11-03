"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CrossIcon, LightbulbIcon } from "./icons";

export interface RoundStats {
  /** Lightbulb taps across the whole round. */
  hints: number;
  /** Wrong letters tapped across the whole round. */
  wrong: number;
  /** Words finished. */
  right: number;
  score: number;
  maxScore: number;
}

const FILL_MS = 1600;

/** The share of the best possible score, as a whole percentage. */
function percentOf({ score, maxScore }: RoundStats): number {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Score card for the trophy screen. No sentences: each row is an icon and a
 * number, and the bar fills up to show how close the round was to perfect.
 */
export default function ScorePanel({ stats }: { stats: RoundStats }) {
  const target = percentOf(stats);
  const [shown, setShown] = useState(0);

  // Fill from empty to the final percentage so the result lands as a moment.
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      const id = window.requestAnimationFrame(() => setShown(target));
      return () => window.cancelAnimationFrame(id);
    }
    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / FILL_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(target * eased);
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  const rows = [
    {
      id: "hints",
      value: stats.hints,
      icon: <LightbulbIcon lit className="h-10 w-10" />,
    },
    {
      id: "wrong",
      value: stats.wrong,
      icon: <CrossIcon className="h-10 w-10" />,
    },
    {
      id: "right",
      value: stats.right,
      icon: <CheckIcon className="h-10 w-10" />,
    },
  ];

  return (
    <section
      data-testid="score-panel"
      data-score={stats.score}
      data-max-score={stats.maxScore}
      data-percent={target}
      className="flex w-full max-w-xs flex-col gap-5 rounded-3xl bg-white/90 p-5 shadow-lg roomy:max-w-sm roomy:p-7"
    >
      <table className="w-full border-separate border-spacing-y-2">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              data-testid={`score-row-${row.id}`}
              data-value={row.value}
              aria-label={row.id}
              className="[&>td]:bg-[color:var(--color-hive)] [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
            >
              <td className="w-16 py-2 pl-4 align-middle">{row.icon}</td>
              <td className="py-2 pr-5 text-right align-middle text-4xl font-black tabular-nums text-[color:var(--color-ink)]">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-2">
        <div
          data-testid="score-bar"
          role="progressbar"
          aria-label="score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(shown)}
          className="h-8 w-full overflow-hidden rounded-full bg-black/10 shadow-inner"
        >
          <div
            data-testid="score-bar-fill"
            data-shown={Math.round(shown)}
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-honey)] to-[color:var(--color-go)]"
            style={{ width: `${shown}%` }}
          />
        </div>
        <p
          data-testid="score-percent"
          className="text-center text-3xl font-black tabular-nums text-[color:var(--color-ink)]"
        >
          {Math.round(shown)}%
        </p>
      </div>
    </section>
  );
}

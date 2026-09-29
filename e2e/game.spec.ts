import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { DIFFICULTIES, blankPositions } from "../lib/words";
import type { Difficulty } from "../lib/types";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/**
 * Word order is random in normal play, so the tests pin it with `?seed=`.
 * Everything else here still reads the word off the page rather than assuming
 * which one came up.
 */
async function start(page: Page, difficulty: Difficulty, seed = 1) {
  await page.goto(`/?seed=${seed}`);
  await page.getByTestId(`difficulty-${difficulty}`).click();
  await expect(page.getByTestId("word-image")).toBeVisible();
}

/** Play a whole round, collecting the words in the order they appeared. */
async function playRound(
  page: Page,
  difficulty: Difficulty,
): Promise<string[]> {
  const seen: string[] = [];
  const total = DIFFICULTIES[difficulty].words.length;

  for (let i = 0; i < total; i++) {
    seen.push(await currentWord(page));
    await solveWord(page);
    await page.getByTestId("btn-next").click();
  }
  return seen;
}

/** The word on screen, read from the pictogram's alt text. */
async function currentWord(page: Page): Promise<string> {
  return (await page.getByTestId("word-image").getAttribute("alt")) ?? "";
}

/** Where the arrow is pointing, or -1 once the word is complete. */
async function cursorAt(page: Page): Promise<number> {
  const arrow = page.getByTestId("cursor-arrow");
  if ((await arrow.count()) === 0) return -1;
  return Number(await arrow.getAttribute("data-cursor-index"));
}

/**
 * Tap the correct letters for the word currently on screen. Blanks are chosen
 * randomly by the app, so this follows the arrow rather than recomputing them.
 */
async function solveWord(page: Page) {
  const word = await currentWord(page);
  // Blanks are fixed once the word is on screen, and the arrow works through
  // them left to right, so reading them once is enough.
  for (const index of await blankIndices(page)) {
    await page.getByTestId(`key-${word[index]}`).click();
  }
}

/** The indices currently showing as empty blanks. */
async function blankIndices(page: Page): Promise<number[]> {
  const ids = await page
    .locator('[data-blank="true"][data-filled="false"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-testid")!),
    );
  return ids.map((id) => Number(id.replace("tile-", ""))).sort((a, b) => a - b);
}

/** A letter that is guaranteed to be wrong for this word. */
function wrongLetterFor(word: string): string {
  const letter = [...ALPHABET].find((candidate) => !word.includes(candidate));
  if (!letter) throw new Error(`no wrong letter available for "${word}"`);
  return letter;
}

function livesLeft(page: Page) {
  return page.getByTestId("lives").getAttribute("data-lives");
}

test("landing shows four difficulties and starts the game immediately", async ({
  page,
}) => {
  await page.goto("/?seed=1");
  for (const difficulty of ["easy", "medium", "hard", "expert"] as const) {
    await expect(page.getByTestId(`difficulty-${difficulty}`)).toBeVisible();
  }
  await expect(page.getByTestId("landing-bee")).toBeVisible();

  await page.getByTestId("difficulty-easy").click();
  await expect(page.getByTestId("word-image")).toBeVisible();
  await expect(page.getByTestId("keyboard")).toBeVisible();
  await expect(page.getByTestId("cursor-arrow")).toBeVisible();
});

test("blank counts follow the difficulty formula", async ({ page }) => {
  const expected: Record<Difficulty, (length: number) => number> = {
    easy: () => 1,
    medium: (length) => Math.ceil(0.25 * length),
    hard: (length) => Math.ceil(0.5 * length),
    expert: (length) => length - 1,
  };

  for (const difficulty of ["easy", "medium", "hard", "expert"] as const) {
    await start(page, difficulty);
    const word = await currentWord(page);
    const blanks = page.locator('[data-blank="true"][data-filled="false"]');
    await expect(blanks).toHaveCount(expected[difficulty](word.length));
  }
});

test("a correct letter fills its tile and moves the arrow along", async ({
  page,
}) => {
  await start(page, "hard");
  const word = await currentWord(page);
  const blanks = await blankIndices(page);
  const [first, second] = blanks;

  // The arrow starts on the leftmost blank.
  expect(await cursorAt(page)).toBe(first);

  await page.getByTestId(`key-${word[first]}`).click();

  await expect(page.getByTestId(`tile-${first}`)).toHaveAttribute(
    "data-filled",
    "true",
  );
  await expect(page.getByTestId(`tile-${first}`)).toHaveText(word[first]);
  // ...and moves on to the next one, left to right.
  expect(await cursorAt(page)).toBe(second);
  expect(second).toBeGreaterThan(first);
});

test("a wrong letter greys out the key and costs exactly one life", async ({
  page,
}) => {
  await start(page, "easy");
  const word = await currentWord(page);
  const wrong = wrongLetterFor(word);
  const key = page.getByTestId(`key-${wrong}`);

  expect(await livesLeft(page)).toBe("5");
  await key.click();

  await expect(key).toHaveAttribute("data-disabled", "true");
  await expect(key).toBeDisabled();
  expect(await livesLeft(page)).toBe("4");

  // Tapping it again must not cost another life.
  await key.click({ force: true });
  expect(await livesLeft(page)).toBe("4");

  // The word is untouched: no tile was filled by the wrong letter.
  const blanks = page.locator('[data-blank="true"][data-filled="false"]');
  await expect(blanks).toHaveCount(1);
});

test("completing a word shows the success overlay and advances progress", async ({
  page,
}) => {
  await start(page, "easy");
  await expect(page.getByTestId("progress")).toHaveAttribute(
    "data-progress",
    "0",
  );

  await solveWord(page);
  await expect(page.getByTestId("overlay-success")).toBeVisible();

  await page.getByTestId("btn-next").click();
  await expect(page.getByTestId("overlay-success")).toBeHidden();
  await expect(page.getByTestId("progress")).toHaveAttribute(
    "data-progress",
    "1",
  );
  await expect(page.getByTestId("progress-dot-0")).toHaveAttribute(
    "data-done",
    "true",
  );
});

test("playing every word correctly wins the round", async ({ page }) => {
  await start(page, "easy");
  const played = await playRound(page, "easy");

  await expect(page.getByTestId("overlay-round-complete")).toBeVisible();
  // Every word in the difficulty is played exactly once, whatever the order.
  expect([...played].sort()).toEqual([...DIFFICULTIES.easy.words].sort());
});

test("the same seed replays the same word order", async ({ page }) => {
  await start(page, "hard", 7);
  const first = await playRound(page, "hard");

  await start(page, "hard", 7);
  const second = await playRound(page, "hard");

  expect(second).toEqual(first);
});

test("word order is shuffled between rounds", async ({ page }) => {
  // Expert has all 26 words, so an unshuffled list would be alphabetical.
  const alphabetical = [...DIFFICULTIES.expert.words];
  const orders: string[][] = [];

  for (const seed of [11, 22, 33]) {
    await start(page, "expert", seed);
    const words: string[] = [];
    for (let i = 0; i < alphabetical.length; i++) {
      words.push(await currentWord(page));
      await solveWord(page);
      await page.getByTestId("btn-next").click();
    }
    expect(words).not.toEqual(alphabetical);
    orders.push(words);
  }

  // Different seeds must not all land on the same order.
  expect(new Set(orders.map((order) => order.join(","))).size).toBeGreaterThan(
    1,
  );
});

test("running out of lives shows the fail screen, and restart gives them back", async ({
  page,
}) => {
  await start(page, "expert");
  expect(await livesLeft(page)).toBe("1");

  await page
    .getByTestId(`key-${wrongLetterFor(await currentWord(page))}`)
    .click();
  await expect(page.getByTestId("overlay-fail")).toBeVisible();

  await page.getByTestId("btn-restart").click();
  await expect(page.getByTestId("overlay-fail")).toBeHidden();
  expect(await livesLeft(page)).toBe("1");
  await expect(page.getByTestId("progress")).toHaveAttribute(
    "data-progress",
    "0",
  );
});

test("easy refills lives each word, hard keeps one pool for the round", async ({
  page,
}) => {
  await start(page, "easy");
  await page
    .getByTestId(`key-${wrongLetterFor(await currentWord(page))}`)
    .click();
  expect(await livesLeft(page)).toBe("4");

  await solveWord(page);
  await page.getByTestId("btn-next").click();
  expect(await livesLeft(page)).toBe("5");

  await start(page, "hard");
  await page
    .getByTestId(`key-${wrongLetterFor(await currentWord(page))}`)
    .click();
  expect(await livesLeft(page)).toBe("2");

  await solveWord(page);
  await page.getByTestId("btn-next").click();
  expect(await livesLeft(page)).toBe("2");
});

test("the home button returns to the landing screen mid-word", async ({
  page,
}) => {
  await start(page, "medium");
  await page.getByTestId("btn-home").click();
  await expect(page.getByTestId("difficulty-easy")).toBeVisible();
});

test("pictograms are served from this host, never from ARASAAC", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3100"))
      external.push(request.url());
  });

  await start(page, "expert");

  // Walk every word so every pictogram in the set gets requested.
  for (let i = 0; i < DIFFICULTIES.expert.words.length; i++) {
    const image = page.getByTestId("word-image");
    const src = await image.getAttribute("src");
    expect(src).toBe(`/pictograms/${await currentWord(page)}.png`);

    const response = await page.request.get(src!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    // A broken image reports naturalWidth 0.
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);

    await solveWord(page);
    await page.getByTestId("btn-next").click();
  }

  await expect(page.getByTestId("overlay-round-complete")).toBeVisible();
  expect(external).toEqual([]);
});

test("no browser alerts or confirms anywhere in the UI", () => {
  const roots = ["app", "components", "lib"];
  const offenders: string[] = [];

  for (const root of roots) {
    const dir = join(process.cwd(), root);
    for (const entry of readdirSync(dir, {
      recursive: true,
      encoding: "utf8",
    })) {
      if (!/\.tsx?$/.test(entry)) continue;
      const source = readFileSync(join(dir, entry), "utf8");
      if (/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/.test(source)) {
        offenders.push(`${root}/${entry}`);
      }
    }
  }

  expect(offenders).toEqual([]);
});

test("every word in the set has a pictogram file", () => {
  const files = new Set(
    readdirSync(join(process.cwd(), "public", "pictograms")),
  );
  for (const word of DIFFICULTIES.expert.words) {
    expect(files).toContain(`${word}.png`);
  }
  expect(files).toContain("bee.png");
});

test.describe("tablet layout", () => {
  // iPad landscape: the keys must be big enough to hit accurately one-handed.
  test.use({ viewport: { width: 1024, height: 768 } });

  test("the keyboard scales up and the board still fits on screen", async ({
    page,
  }) => {
    await start(page, "easy");

    const key = await page.getByTestId("key-q").boundingBox();
    expect(key!.height).toBeGreaterThanOrEqual(80);
    expect(key!.width).toBeGreaterThanOrEqual(80);

    // Nothing may be pushed off screen: the whole board has to be reachable
    // without scrolling, in either direction.
    const overflow = await page.evaluate(() => ({
      vertical: document.documentElement.scrollHeight > window.innerHeight,
      horizontal: document.documentElement.scrollWidth > window.innerWidth,
    }));
    expect(overflow).toEqual({ vertical: false, horizontal: false });

    await expect(page.getByTestId("word-image")).toBeInViewport();
    await expect(page.getByTestId("word")).toBeInViewport();
    await expect(page.getByTestId("key-m")).toBeInViewport();
  });

  test("the longest word still fits on one line", async ({ page }) => {
    await start(page, "expert");
    // Walk to xylophone, the longest word in the set.
    while ((await currentWord(page)) !== "xylophone") {
      await solveWord(page);
      await page.getByTestId("btn-next").click();
    }

    const tiles = page.locator('[data-testid^="tile-"]');
    await expect(tiles).toHaveCount(9);

    const boxes = await tiles.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().top),
    );
    // All tiles share a top edge, so the row has not wrapped.
    expect(new Set(boxes).size).toBe(1);
  });
});

test("a phone in landscape keeps the compact keyboard", async ({ page }) => {
  // Wide but very short: enlarging here would push the picture off screen.
  await page.setViewportSize({ width: 844, height: 390 });
  await start(page, "easy");

  const key = await page.getByTestId("key-q").boundingBox();
  expect(key!.height).toBeLessThan(80);

  const horizontal = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(horizontal).toBe(false);
});

test("the same word gets different blanks each time it comes up", async ({
  page,
}) => {
  // The seed pins the word order, so word 1 is the same every reload — only
  // the blanks are free to change.
  const seen = new Set<string>();

  for (let attempt = 0; attempt < 12; attempt++) {
    await start(page, "hard");
    seen.add((await blankIndices(page)).join(","));
  }

  expect(seen.size).toBeGreaterThan(1);
});

test("blank selection follows the rules for every word", () => {
  const SAMPLES = 60;
  // Checks run as plain conditions and only failures are collected. Asserting
  // inside the loop would mean tens of thousands of expect() calls, which is
  // slow enough to dominate the whole suite.
  const badShape: string[] = [];
  const wrongFirstLetter: string[] = [];
  const notVarying: string[] = [];

  for (const difficulty of ["easy", "medium", "hard", "expert"] as const) {
    const {
      words,
      blanks: formula,
      keepFirstLetter,
    } = DIFFICULTIES[difficulty];

    for (const word of words) {
      const expectedCount = formula(word.length);
      const available = word.length - (keepFirstLetter ? 1 : 0);
      const results = new Set<string>();
      let sawFirstLetter = false;

      for (let i = 0; i < SAMPLES; i++) {
        const positions = blankPositions(word, difficulty);
        const ascending = positions.every(
          (p, j) => j === 0 || p > positions[j - 1],
        );
        const inRange = positions.every((p) => p >= 0 && p < word.length);

        if (positions.length !== expectedCount || !ascending || !inRange) {
          badShape.push(`${difficulty}/${word}: ${positions.join(",")}`);
        }
        if (positions.includes(0)) sawFirstLetter = true;
        results.add(positions.join(","));
      }

      // Expert anchors the word on its first letter; nothing else does.
      if (sawFirstLetter === keepFirstLetter) {
        wrongFirstLetter.push(`${difficulty}/${word}`);
      }
      // Unless every available position has to be blanked, the choice must vary.
      if (expectedCount < available !== results.size > 1) {
        notVarying.push(`${difficulty}/${word}: ${results.size} distinct`);
      }
    }
  }

  expect(badShape).toEqual([]);
  expect(wrongFirstLetter).toEqual([]);
  expect(notVarying).toEqual([]);
});

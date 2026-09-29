#!/usr/bin/env node
// Reproducibility script — NOT part of the build.
// Downloads the selected ARASAAC pictograms into public/pictograms/
// and rewrites data/pictograms.json.
//
// Usage: node scripts/fetch-pictograms.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_DIR = join(ROOT, "public", "pictograms");
const DATA_FILE = join(ROOT, "data", "pictograms.json");
const RESOLUTION = 500;

// word -> ARASAAC pictogram id (hand-picked: literal, concrete, child-recognisable)
const PICTOGRAMS = {
  apple: 2462,
  ball: 3241,
  cat: 2406,
  dog: 2517,
  egg: 2427,
  fish: 2520,
  girl: 27509,
  hat: 2572,
  island: 2966,
  jam: 2470,
  key: 8153,
  leaf: 5077,
  moon: 2933,
  nose: 2887,
  orange: 2483,
  pig: 2327,
  queen: 5559,
  rain: 3123,
  sun: 2798,
  tree: 2256,
  umbrella: 2500,
  van: 21878,
  water: 2248,
  xylophone: 2616,
  yogurt: 2618,
  zebra: 2324,
  bee: 2239,
  duck: 2563,
  frog: 2543,
};

const ATTRIBUTION = {
  author: "Sergio Palao",
  origin: "ARASAAC (http://arasaac.org)",
  owner: "Gobierno de Aragon",
  license: "CC BY-NC-SA 4.0",
};

async function download(word, id) {
  const url = `https://api.arasaac.org/v1/pictograms/${id}?download=false&resolution=${RESOLUTION}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${word} (${id}): HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000 || buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`${word} (${id}): not a valid PNG (${buf.length} bytes)`);
  }
  await writeFile(join(IMAGE_DIR, `${word}.png`), buf);
  console.log(`ok  ${word.padEnd(10)} ${id}  ${buf.length} bytes`);
}

async function main() {
  await mkdir(IMAGE_DIR, { recursive: true });
  await mkdir(dirname(DATA_FILE), { recursive: true });

  for (const [word, id] of Object.entries(PICTOGRAMS)) {
    await download(word, id);
  }

  const pictograms = {};
  for (const [word, id] of Object.entries(PICTOGRAMS)) {
    pictograms[word] = { id, keyword: word };
  }

  await writeFile(
    DATA_FILE,
    JSON.stringify({ attribution: ATTRIBUTION, pictograms }, null, 2) + "\n",
  );
  console.log(`wrote ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

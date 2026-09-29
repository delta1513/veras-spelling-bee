---
name: add-word
description: Add a new word + pictogram pair to Vera's Spelling Bee, or replace the image for an existing word. Use when asked to add/remove/swap a word, change a picture, or extend the word list.
---

# Adding a word to Vera's Spelling Bee

Read this whole file before touching anything. Picking the *image* is the hard
part of this job and the part that is easiest to get wrong.

## Who this is for

Vera is the only user of this app. She is a stroke survivor, born in the 1960s,
with limited experience of technology. Specifically:

- **She cannot comprehend written text.** Not sentences, not instructions, not
  labels. At best she can correlate a *single* word to an object or an action.
  There is nothing in this app she can read her way out of.
- **She cannot use her right hand.** Everything happens one-handed on a phone.
- **She cannot speak** beyond a few practiced words and sounds, and cannot say
  every letter of the alphabet.
- **She navigates by memorising visual flows** and by recognising pictures.

The consequence for this task: **the picture is the entire definition of the
word.** It is not decoration next to a label she can fall back on — if she
cannot name the picture at a glance, the puzzle is unsolvable and she has no way
to recover. A picture that is merely "related to" the word is a failure.

## What makes an acceptable image

The bar is deliberately high. Reject anything that does not clear it.

- **One subject, alone, centred.** A single object filling the frame. No scenes,
  no backgrounds, no second object, no hands holding the thing, no context props.
- **The most literal, prototypical form of the word.** "Apple" is one whole red
  apple — not a slice, not a basket of apples, not an apple tree, not a bitten
  apple.
- **Unambiguous at a glance.** If a reasonable person shown the picture cold
  might say a *different* word, it is wrong. "A glass of juice" is not "orange".
- **No text, letters, numbers or symbols anywhere in the image.** She cannot read
  them, and they add visual noise that competes with the subject.
- **Bold, flat, high-contrast shapes.** Thick outlines, solid colours. ARASAAC's
  core-vocabulary pictograms are drawn this way; photographs and detailed
  illustrations are not acceptable.
- **No people unless the word is about a person** (girl, queen). People invite
  the wrong noun — she may say "woman" when the word is "hat".
- **Concrete nouns only.** Verbs, adjectives, emotions and abstractions cannot be
  drawn unambiguously. Do not add them.

Also required for the game to work at all:

- **The word must be lowercase a–z, one word, no spaces, hyphens or accents.**
  The on-screen keyboard has 26 letter keys and nothing else. "ice cream" and
  "yo-yo" are unplayable.
- **Prefer 3–8 letters.** Longer words shrink the tiles; past 9 letters they get
  hard to tap accurately one-handed.
- **Prefer regular, phonetic spellings.** She is learning letter-by-letter; silent
  letters ("yacht", "knee") teach the wrong lesson.

## Process

### 1. Find candidate pictograms

The ARASAAC API needs no key:

```bash
curl -s "https://api.arasaac.org/v1/pictograms/en/search/WORD" | head -c 2000
```

Useful fields on each result: `_id`, `tags`, `categories`, `keywords[].keyword`,
`schematic`, `violence`, `sex`.

Shortlist by: an exact `keywords[].keyword` match, `schematic: false`, sensible
`tags`, and a lower `_id` (the low ids are the older hand-drawn core vocabulary
and are usually the cleanest). Never use anything with `violence: true` or
`sex: true`.

Beware homonyms — this is where mistakes happen. `orange` returns both the fruit
and the colour swatch; `jam` returns the preserve and a traffic jam; `water`
returns the drink and the verb "to irrigate"; `key` returns a door key and a
keyboard. Disambiguate using `tags`/`categories`, never by id alone.

### 2. Look at it

Download the candidate and **actually view the image** before committing to it:

```bash
curl -s "https://api.arasaac.org/v1/pictograms/ID?download=false&resolution=500" -o /tmp/candidate.png
```

Then open it with the Read tool. Do not skip this. The metadata regularly
disagrees with the drawing — a pictogram tagged `fruit` can still turn out to be
a pale, near-colourless jar that reads as "jar" rather than "jam". Judge it
against the bar above, as if you were Vera seeing it for the first time.

If nothing in the catalogue clears the bar, **say so and propose a different
word.** Shipping a vague picture is worse than shipping a shorter word list.

### 3. Wire it in

Four files, in this order:

1. **`scripts/fetch-pictograms.mjs`** — add `word: id` to the `PICTOGRAMS` map.
   This is the source of truth for which pictogram belongs to which word.
2. **Run it** — `node scripts/fetch-pictograms.mjs`. It downloads every PNG into
   `public/pictograms/`, validates the PNG magic bytes and size, and rewrites
   `data/pictograms.json`. Never hand-edit `data/pictograms.json` or download the
   image manually; the script is what keeps them in step.
3. **`lib/words.ts`** — add the word to `ALL_WORDS`, keeping the array
   alphabetical. That alone puts it into the **expert** round and, because
   `HARD_WORDS` is derived as "everything not in easy or medium", into the
   **hard** round too. To use it in easy or medium instead, add it to
   `EASY_WORDS` or `MEDIUM_WORDS` — those lists are hand-picked and short, so
   remove another word if you want to keep the round at five.
4. **Commit the PNG.** `public/pictograms/*.png` are permanent artifacts in this
   repo. The app is hosted and must never call ARASAAC at runtime.

Nothing else needs changing. Blank positions are drawn at random from the word's
length, progress dots are driven by the round length, and each round shuffles its
own words — so where you put the word in `ALL_WORDS` affects nothing but tidiness.

### 4. Verify

```bash
npm run test:e2e
```

This builds the static export, serves `out/`, and runs the suite — including
checks that every word in the set has a matching PNG, that pictograms are served
from this host rather than ARASAAC, and that the blank counts still follow the
difficulty formulas. All tests must pass.

Then look at the word in the running app (`npm run dev`) at a phone width and
confirm the tiles still fit on one line.

## Attribution

ARASAAC pictograms are CC BY-NC-SA: created by Sergio Palao for ARASAAC
(<http://arasaac.org>), owned by Gobierno de Aragón. The attribution already
appears in `README.md` and in the footer of the landing page — keep it there.

## Things not to do

- Do not add a word without a picture that clears the bar.
- Do not substitute an emoji, an icon, or an AI-generated image for a pictogram.
  The set has one consistent visual language and breaking it costs her the
  recognition she has built up.
- Do not add explanatory text, hints, or labels anywhere in the UI to compensate
  for a weak image. She cannot read them.
- Do not hotlink `api.arasaac.org` from the app.

# Vera's Spelling Bee

A picture-led spelling game. A pictogram shows what the word means, most of the
letters are already on screen, and the player taps the missing ones on a
Wordle-style QWERTY keyboard.

It is built for a player who cannot read prose: there are no sentences,
instructions, or browser dialogs anywhere in the UI. Every control is an emoji,
an icon, or a colour, touch targets are large, and the whole board is reachable
one-handed on a phone.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
npm run test:e2e   # builds, serves out/, runs the Playwright suite
```

`npm run build` produces a fully static site in `out/` — drop it on any static
host. There are no runtime API calls and no server.

## Deploying to Cloudflare Workers

The site is served as static assets from a Cloudflare Worker (no Worker script).
`wrangler.jsonc` points the assets directory at `out/` and runs `npm run build`
itself before uploading, so the connected Cloudflare Git integration only needs
the default deploy command (`npx wrangler deploy`).

```bash
npm run cf:preview # build, then serve out/ locally through wrangler
npm run deploy     # build and deploy manually
```

The `name` in `wrangler.jsonc` must match the Worker name in the Cloudflare
dashboard.

## How the game works

| Difficulty | Words | Blanks per word | Lives |
| --- | --- | --- | --- |
| Easy | 5 | 1 | 5, refilled each word |
| Medium | 5 | `ceil(0.25 × length)` | 4, refilled each word |
| Hard | 16 | `ceil(0.5 × length)` | 3 for the whole round |
| Expert | 26 | every letter but the first | 1 for the whole round |

The word list has one word per letter of the alphabet. Each round shuffles its
words into a fresh order, and the hidden letters are picked at random every time
a word comes up — so the same word is a different puzzle on each encounter and
has to be spelled rather than recalled as a shape.

Any letter can be hidden, including the first. The one exception is expert,
which always keeps the first letter as an anchor and hides all the rest.

Adding `?seed=<number>` to the URL fixes the word order, so a round can be
replayed exactly. The end-to-end tests use it; ordinary play leaves it off.

A correct letter fills its tile and the arrow moves to the next blank. A wrong
letter greys that key out for the rest of the word and costs a life. Lives gone
means a sad-face screen with a restart button; all words done means a trophy.

## Pictograms

The 26 word images plus the bee are committed under `public/pictograms/` and
served from this host. `scripts/fetch-pictograms.mjs` records how they were
selected from the ARASAAC API and can regenerate them, but it is not part of the
build. `data/pictograms.json` maps each word to its ARASAAC id.

Pictograms are the property of the Government of Aragón and have been created by
Sergio Palao for ARASAAC (<http://arasaac.org>), which distributes them under
Creative Commons BY-NC-SA licence.

## Not in this version

Audio. Speaking the letter as it is tapped, and the word on success, is the next
thing to add.

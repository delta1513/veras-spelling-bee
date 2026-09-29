<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# About this project

Vera's Spelling Bee is a spelling game for one person: Vera. It is a static Next.js site. It has no server and no API calls.

## Who Vera is

Vera is a stroke survivor. She was born in the 1960s. She did not grow up with technology, so her knowledge of it is limited. She is the main user of every system in this project.

Vera has these limits:

- She cannot use her right hand. She uses one hand only.
- She cannot read written text, except simple single words. She can connect one word to one object or one action.
- She cannot understand a sentence.
- She cannot speak, except a few simple, practiced words and sounds.
- She cannot say some letters of the alphabet. She can say most of them.

Vera depends on visual cues. She uses them to remember a flow in a user interface. She also uses them to understand a situation and to connect a word to an object or action.

Vera can do these things:

- She can copy text with the QWERTY keyboard on her phone, if the text is on the screen. If the screen shows "Banana", she can type "Banana".
- She can follow a complex flow after someone teaches her. For example, she learned to touch and hold text to start text-to-speech on her Apple phone.
- She knows some apps after instruction: messages, phone, contacts, Facebook, and WhatsApp.

## Rules for every change

Vera cannot understand text. Therefore, think about her limits before you add or change any feature. For example, do not add an alert pop-up, because she cannot read it. Use buttons with images or emojis that show the action.

You must obey these rules:

- Do not add sentences, instructions, labels, or error messages to the UI.
- Do not use `alert`, `confirm`, `prompt`, or a text dialog.
- Show each action with an emoji, an icon, a picture, or a color.
- Keep each flow short, and keep it the same every time. Vera learns a flow by memory.
- Make each touch target large.
- Make sure that one hand can reach every control on a phone.
- Do not require speech, and do not require a gesture that needs two hands.
- Do not require a complex gesture, such as a pinch or a drag, unless Vera can learn it.
- If a word appears, it must be a single simple word that has a picture next to it.
- Show what happened with a clear visual result, for example a trophy or a sad face.
- Do not remove or rename a control that Vera already knows, unless there is a strong reason.
- Do not assume that Vera knows a common web pattern. Menus, swipes, and hidden controls can confuse her.
- If a new feature needs text to work, change the design. Do not add the text.

Before you finish, ask this question: "Can Vera use this feature with one hand, without reading?" If the answer is no, change the feature.

## How the game works

The player sees one picture, which shows a word. Most letters of the word are on screen. The player taps the missing letters on a QWERTY keyboard.

- A correct letter fills its tile. The arrow moves to the next blank.
- A wrong letter turns its key gray for the rest of the word. It costs one life.
- If lives reach zero, the game shows a sad face and a restart button.
- If the player finishes all words, the game shows a trophy.

The game has four difficulty levels. The table shows the values.

| Difficulty | Words | Blanks per word | Lives |
| --- | --- | --- | --- |
| Easy | 5 | 1 | 5 for each word |
| Medium | 5 | `ceil(0.25 × length)` | 4 for each word |
| Hard | 16 | `ceil(0.5 × length)` | 3 for the round |
| Expert | 26 | all letters except the first | 1 for the round |

The word list has one word for each letter of the alphabet. Each round shuffles the words. The game picks the hidden letters at random each time. Expert always shows the first letter.

Add `?seed=<number>` to the URL to fix the word order. The tests use it.

## Project layout

- `app/`: Next.js entry files (`page.tsx`, `layout.tsx`, `globals.css`).
- `components/`: UI parts. `Game.tsx` holds the game logic. `Keyboard.tsx`, `WordDisplay.tsx`, and the overlay files draw the screen. `icons.tsx` holds the icons.
- `lib/words.ts`: the word list and the difficulty settings.
- `lib/types.ts`: shared types.
- `data/pictograms.json`: maps each word to an ARASAAC picture id.
- `public/pictograms/`: the picture for each word.
- `scripts/fetch-pictograms.mjs`: records how the pictures were chosen. It is not part of the build.
- `e2e/game.spec.ts`: Playwright tests.
- `.claude/skills/add-word/SKILL.md`: the procedure to add or change a word. Read it before you change a word or a picture.

## Commands

- `npm run dev`: start the dev server at `http://localhost:3000`.
- `npm run build`: make the static site in `out/`.
- `npm run lint`: run ESLint.
- `npm run test:e2e`: build, serve `out/`, and run the Playwright tests.
- Do not deploy by hand. The Cloudflare GitHub app deploys the site each time a push reaches `main`.

## Pictures

The picture is the full meaning of the word for Vera. Each picture must show one clear object that Vera can name at a glance. It must not contain text. The pictures come from ARASAAC. The license is Creative Commons BY-NC-SA. Keep the credit to ARASAAC in `README.md`.

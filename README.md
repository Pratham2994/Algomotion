# Algomotion

Sorting and pathfinding algorithms, one step at a time. Forwards and backwards.

**[Open it](https://algomotion-pratham.vercel.app/)**

I only understood algorithms once I could watch them move. This is the thing I wanted
when I was learning them.

## The one idea

No algorithm here is slowed down to be drawn. Each one runs to the end first, at full
speed, and writes down every compare, swap and visit. The page then plays that list.

That one choice gives the rest for free:

- **Step back.** The page draws the state at step 412 by playing steps 0 to 412. So
  step 411 is as easy as step 413.
- **A timeline.** Drag it to any point of the run.
- **A scoreboard.** All eleven sorts have already run on your list, so the table of
  comparisons and writes is there before you press play.

## What is in it

| Page | What you do there |
| --- | --- |
| Sorting | Watch 11 sorts on a list of 5 to 100 bars. Random, nearly sorted, reversed, or few values |
| Pathfinding | Six searches on a maze or an open field. Draw walls, drag the two ends, add heavy cells and diagonal moves |
| Complexity | Count the work on bigger and bigger lists, and set the dots against the Big-O curves. Saves to CSV |
| Library | Pseudocode, costs and uses for all 17 algorithms |
| Code check | Paste a function. A model estimates its Big-O and says where the time goes |

**Sorting:** Bubble, Insertion, Selection, Merge, Quick, Heap, Counting, Radix (LSD),
TimSort, IntroSort, Pancake.

**Pathfinding:** BFS, DFS, Dijkstra, A* (Manhattan, Euclidean or Octile), Greedy
best-first, Dial's.

Space plays and pauses. The arrow keys step, and Shift with an arrow steps by ten.

Every setting is in the address bar. The same link opens the same list or the same
maze, because both are built from a seed.

## Run it

```sh
git clone https://github.com/Pratham2994/Algomotion.git
cd Algomotion
npm install
npm run dev
```

Open http://localhost:5173.

```sh
npm run build    # build for production
npm run preview  # serve the build
npm run lint
```

The Code check page needs the function in `api/complexity.js`. That is a Vercel
function, so it runs on the deployed site and not under `npm run dev`. It calls a free
model on OpenRouter and needs `OPENROUTER_API_KEY3` in the environment. Free models
come and go, so it names three and takes the first that answers. Set `OPENROUTER_MODEL`
to put your own choice in front.

## How it is built

```
src/
  lib/sortEmitters.js   The 11 sorts. Each returns { steps, metrics }
  lib/pathCore.js       The 6 searches, the maze builder, the seeded random numbers
  lib/benchCore.js      The same sorts with no recording, for the Complexity page
  lib/libraryData.js    The text of the Library
  hooks/usePlayer.js    The playhead: play, pause, step, seek, keys
  pages/                One file for each page
api/complexity.js       The serverless function behind Code check
```

A step is a small object: `{ type: 'swap', i: 3, j: 7 }` or
`{ type: 'visit', r: 4, c: 9 }`. The player knows nothing about sorting or mazes. It
holds a number, and the page draws what the list says at that number.

React 19 and Vite, with plain CSS. No UI library and no chart library. The chart on the
Complexity page is drawn by hand as SVG.

## Licence

MIT.

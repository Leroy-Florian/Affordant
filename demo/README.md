# @affordant/demo

An end-to-end demo proving the family works together over real HTTP — across **two backends** and **two fronts**. Not published.

The contract is the only thing in the middle, so any producer pairs with any consumer:

|  | Express backend | Node backend (100% JS) |
|---|---|---|
| **Vanilla JS front** | ✓ | ✓ |
| **React front** | ✓ | ✓ |

- Backends emit the same `_self` / `_actions` envelope, gating `cancel` on the caller and the order's state:
  - `src/server/express.ts` — Express + `@affordant/server` + `@affordant/express`
  - `src/server/node.mjs` — raw `node:http`, 100% JavaScript, `@affordant/server` only (no framework)
- Fronts consume it:
  - `src/front/flow.ts` — vanilla, plain `affordant` calls
  - `src/front/OrderCard.tsx` — React, `@affordant/react` hooks

## Automated verification

```sh
npm test          # from the repo root — the 2 fronts × 2 backends matrix (HTTP, jsdom)
npm run e2e       # browser E2E: drives both fronts in a real browser (Playwright)
```

`tests/{vanilla,react}.e2e.test.*` run each front against **both** backends. `e2e/*.spec.ts` open the actual browser pages and click through the contract. (Run `npm run e2e:install` once to fetch the browser.)

## Run it — one command

```sh
npm run demo        # from the repo root — starts both backends + the web, wired together
```

Open the **dashboard** at <http://localhost:5173>: a small Aspire-like board listing every service — Express API (`:8787`), Node API (`:8788`), and the React & vanilla fronts — with **live up/down status** and one-click links.

From there, open the React front, tick *Authenticated as owner*, and watch the **Cancel** button appear; click it and it vanishes once the order is cancelled. The vanilla front does the same with no framework. (Need just one piece? `npm run dev:express`, `npm run dev:node`, or `npm run web`.)

For the **published** packages (not the workspace sources), see [`../smoke`](../smoke).

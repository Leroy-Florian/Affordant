# @affordant/demo

An end-to-end demo proving the whole family works together over real HTTP. Not published.

A real **Express** server (`@affordant/server` + `@affordant/express`) emits the `_self` / `_actions` envelope, gating `cancel` on the caller and the order's state. Then every consumer hits it over HTTP and the tests assert the contract: *anonymous → no `cancel`; owner of a pending order → `cancel` offered; after `follow(cancel)` → the action is gone.*

## Run it

```sh
npm run demo        # from the repo root — boots the server and prints curl hints
```

```sh
curl http://127.0.0.1:PORT/orders/8f3a2c | jq ._actions                          # only "track"
curl -H 'authorization: Bearer u1' .../orders/8f3a2c | jq ._actions             # "track" + "cancel"
curl -X POST -H 'authorization: Bearer u1' .../orders/8f3a2c/cancel | jq ._actions
```

## What the E2E suites cover

Each runs against a freshly booted server on an ephemeral port:

| Suite | Packages exercised |
|---|---|
| `vanilla.e2e` | `affordant` (`can` / `actionFor` / `follow`) + `@affordant/server` + `@affordant/express` |
| `effect.e2e` | `@affordant/effect` (Effect invoker, typed errors) |
| `react.e2e` | `@affordant/react` (`useAffordance`, `useFollow`) in jsdom |
| `react-effect.e2e` | `effect-react-bridge` + `@affordant/react/effect` + `@affordant/effect` composed |

Together they touch all seven packages against a real server.

```sh
npm test            # from the repo root — builds, then runs unit + E2E
```

For the published artifacts (not the workspace sources), see [`../smoke`](../smoke).

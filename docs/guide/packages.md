# The packages

Affordant is a small family in one npm-workspaces monorepo. They share a single wire contract and stay symmetric across the wire: the server builds what the client consumes.

![How the Affordant packages fit together: @affordant/contract feeds both the server and the client; @affordant/server builds the _self / _actions envelope, which the affordant client reads; @affordant/express and @affordant/react sit alongside the server and client respectively.](/diagrams/packages.svg)

| Package | Side | Depends on | What it does |
|---|---|---|---|
| [`@affordant/contract`](/reference/contract) | shared | — | The wire-contract types. Zero runtime, zero deps. Everything else depends on it. |
| [`affordant`](/reference/api) | client | contract | `can` / `actionFor` / `follow`. Zero runtime deps — runs anywhere `fetch` exists. |
| [`@affordant/react`](/reference/react) | client | contract, affordant, *react* | React adapter: gate UI on affordances and follow them with hooks. |
| [`@affordant/server`](/reference/server) | server | contract | A builder for the `_self` / `_actions` envelope. Framework-agnostic. |
| `@affordant/express` | server | server, *express* | Express adapter: send the envelope, build URLs from the request. |

Italic dependencies are **peer** dependencies — you bring your own React / Express. The client core (`affordant`) and the server core (`@affordant/server`) carry no runtime dependencies at all.

## On Effect (and other effect systems)

`follow` is a plain `async` function returning a `Promise<Response>`. If you work with [Effect](https://effect.website) — or any other effect system — you can wrap it yourself in a line, e.g. `Effect.tryPromise(() => follow(action, init))`. Affordant stays **Effect-compatible without shipping an Effect dependency**: the interop is yours to add when you want it, never imposed.

## Develop

```sh
npm install        # installs all workspaces
npm run build      # builds every package, contract first
npm test           # unit tests + end-to-end demo suites
npm run typecheck  # type-checks every package
```

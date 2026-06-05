# The packages

Affordant is a small family of packages in one npm-workspaces monorepo. They share a single wire contract and stay symmetric across the wire: the server builds what the client consumes.

```
                 ┌─ @affordant/contract (shared wire types) ─┐
                 │                                           │
   @affordant/server  ──builds──►  _self / _actions  ──reads──►  affordant   (Promise invoker)
        │                                                          │          @affordant/effect (Effect invoker)
   @affordant/express                                        @affordant/react (hooks, either invoker)
```

## The membership rule

> A package belongs in the Affordant family **if and only if it is coupled to the wire contract.**

That single rule decides everything. It keeps the family cohesive and tells you where a new idea goes.

## The family (contract-coupled)

| Package | Side | Depends on | What it does |
|---|---|---|---|
| [`@affordant/contract`](/reference/contract) | shared | — | The wire-contract types. Zero runtime, zero deps. Everything else depends on it. |
| [`affordant`](/reference/api) | client | contract | `can` / `actionFor` / `follow`. The vanilla **Promise** invoker. Zero runtime deps. |
| [`@affordant/effect`](/reference/effect) | client | contract, affordant, *effect* | The **Effect** invoker: `follow` as an `Effect` with a typed error channel. |
| [`@affordant/react`](/reference/react) | client | contract, affordant, *react* | React adapter: gate UI on affordances, invoke with **either** invoker. |
| [`@affordant/server`](/reference/server) | server | contract | A builder for the `_self` / `_actions` envelope. Framework-agnostic. |
| `@affordant/express` | server | server, *express* | Express adapter: send the envelope, build URLs from the request. |

Italic dependencies are **peer** dependencies — you bring your own React / Effect / Express.

## The exception that proves the rule

| Package | Coupled to | Why it lives here |
|---|---|---|
| [`effect-react-bridge`](/reference/effect-react-bridge) | React + Effect | Running Effects inside React is a **generic** concern — nothing to do with hypermedia. It is an independent publication that merely shares this workspace, and `@affordant/react`'s Effect path composes with it. |

If you only need the React + Effect bridge and never touch Affordant, you can take `effect-react-bridge` on its own.

## Two orthogonal axes on the client

Consuming an affordance has two independent choices: the **UI framework** and the **effect system**. They compose instead of multiplying — see [Invokers: Promise & Effect](/guide/invokers).

## Develop

```sh
npm install        # installs all workspaces
npm run build      # builds every package, contract first
npm test           # runs every package's tests
npm run typecheck  # type-checks every package
```

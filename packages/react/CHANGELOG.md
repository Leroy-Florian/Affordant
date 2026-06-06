# @affordant/react

## 0.3.0

### Minor Changes

- a52790f: Simplify the React adapter to the core hooks only. Removes the `@affordant/react/effect` subpath and the optional Effect peer dependencies; `useFollow` returns a `Promise<Response>` that drops into Effect with a one-line wrap when you want it. The standalone Effect packages (`@affordant/effect`, `effect-react-bridge`) have been removed from the family — Affordant stays Effect-compatible without shipping an Effect dependency.

## 0.2.0

### Minor Changes

- 538e777: Initial public release of the Affordant package family: the shared wire contract (`@affordant/contract`), the vanilla Promise client (`affordant`), the Effect invoker (`@affordant/effect`), the React adapter (`@affordant/react`), the server-side envelope builder (`@affordant/server`), the Express adapter (`@affordant/express`), and the domain-agnostic Effect↔React bridge (`effect-react-bridge`).

### Patch Changes

- Updated dependencies [538e777]
  - @affordant/contract@0.2.0
  - affordant@0.2.0

# @affordant/express

## 0.3.0

### Minor Changes

- 7e7bc46: `sendResource` now emits every `_actions` rel as RFC 8288 `Link` header entries, not just `_self`.

## 0.2.0

### Minor Changes

- 538e777: Initial public release of the Affordant package family: the shared wire contract (`@affordant/contract`), the vanilla Promise client (`affordant`), the Effect invoker (`@affordant/effect`), the React adapter (`@affordant/react`), the server-side envelope builder (`@affordant/server`), the Express adapter (`@affordant/express`), and the domain-agnostic Effect↔React bridge (`effect-react-bridge`).

### Patch Changes

- Updated dependencies [538e777]
  - @affordant/server@0.2.0

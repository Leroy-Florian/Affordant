---
"@affordant/react": minor
---

Simplify the React adapter to the core hooks only. Removes the `@affordant/react/effect` subpath and the optional Effect peer dependencies; `useFollow` returns a `Promise<Response>` that drops into Effect with a one-line wrap when you want it. The standalone Effect packages (`@affordant/effect`, `effect-react-bridge`) have been removed from the family — Affordant stays Effect-compatible without shipping an Effect dependency.

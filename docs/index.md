---
layout: home

hero:
  name: Affordant
  text: Affordance-first hypermedia client
  tagline: Stop re-implementing your authorization in the frontend. Let the actions the server offers drive your UI.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: The wire contract
      link: /guide/wire-contract
    - theme: alt
      text: View on GitHub
      link: https://github.com/Leroy-Florian/Affordant

features:
  - title: Zero dependencies
    details: A handful of plain functions over plain data. Runs anywhere fetch exists — browsers, Node ≥ 18, Deno, Bun, edge workers.
  - title: Authorization, expressed once
    details: The presence of a link encodes permission. The frontend renders off can(), it never re-derives your auth rules.
  - title: Framework-agnostic
    details: No hooks, no stores, no adapter. The same plain functions work in React, Vue, Svelte, or vanilla TypeScript.
---

## The idea in thirty seconds

Your frontend never builds a URL, never picks an HTTP verb, never duplicates an authorization rule. It asks three questions:

```ts
import { can, actionFor, follow } from 'affordant'

if (can(order, 'cancel')) {                        // 1. What is the server offering me?
  await follow(actionFor(order, 'cancel')!, {      // 2. Where / how?  3. Do it.
    token: () => localStorage.getItem('token'),
    body: { reason: 'changed my mind' },
  })
}
```

If the backend stops offering an action — not authorized, wrong state, feature off — the button disappears. No frontend deploy.

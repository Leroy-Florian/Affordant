---
layout: home

hero:
  name: Affordant
  text: Affordance-first hypermedia, both sides of the wire
  tagline: Stop re-implementing your authorization in the frontend. The server declares the actions it offers; your UI renders off them.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: The packages
      link: /guide/packages
    - theme: alt
      text: View on GitHub
      link: https://github.com/Leroy-Florian/Affordant

features:
  - title: Authorization, expressed once
    details: The presence of a link encodes permission. The server decides per response; the frontend renders off can() and never re-derives your auth rules.
  - title: One contract, both sides
    details: The server's build() produces exactly what the client's can() consumes. A shared types package keeps producer and consumer from ever drifting.
  - title: Zero-dependency cores, optional declinations
    details: The client and server cores are plain functions over plain data. React hooks and an Effect invoker are opt-in packages — the cores never depend on them.
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

## The other side of the wire

The server declares those same affordances once, gating each on authoritative state. When `when` is false, the rel is never emitted — so `can()` returns false on the client.

```ts
import { resource } from '@affordant/server'

resource(order)
  .self(route('orders.show', order.id))
  .action('cancel', route('orders.cancel', order.id), {
    method: 'POST',
    when: caller.id === order.ownerId && order.status !== 'shipped',
  })
  .build()
```

One contract, never two implementations to keep in sync. See [the packages](/guide/packages) for the whole family.

# @affordant/server

Server-side builder for the **Affordant** hypermedia envelope. It is the mirror of the [`affordant`](https://www.npmjs.com/package/affordant) client: where the client asks `can(resource, rel)`, the server declares each affordance once and gates it on authoritative state.

Framework-agnostic and zero runtime dependency (it shares only the [`@affordant/contract`](https://www.npmjs.com/package/@affordant/contract) types). URL generation is *injected*, so it stays decoupled from any router — thin adapters such as [`@affordant/express`](https://www.npmjs.com/package/@affordant/express) wire that part up.

## Install

```sh
npm install @affordant/server
```

## Usage

```ts
import { resource } from '@affordant/server'

function serializeOrder(order, caller, route) {
  return resource(order)
    .self(route('orders.show', order.id))
    .action('track', route('orders.tracking', order.id))
    .action('cancel', route('orders.cancel', order.id), {
      method: 'POST',
      when: caller.id === order.ownerId && order.status !== 'shipped',
    })
    .build()
}
```

The result is exactly what `can(order, 'cancel')` consumes on the client. When `when` is `false`, the rel is **not emitted** — so the client never offers it. Presence of the link *is* the permission.

## API

| Export | Description |
|---|---|
| `resource(data)` | Start a builder over a plain object. |
| `.self(href, { method? })` | Set the `_self` link (method defaults to `GET`). |
| `.action(rel, href, { method?, accepts?, when? })` | Offer `rel`. `when: false` omits it. `method` defaults to `GET`. |
| `.build()` | Return the `_self` / `_actions` wire resource. `_actions` is always present. |

## License

MIT

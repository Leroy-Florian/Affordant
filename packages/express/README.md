# @affordant/express

[Express](https://expressjs.com) adapter for **Affordant**. It sends the [`@affordant/server`](https://www.npmjs.com/package/@affordant/server) envelope straight from your controllers and builds absolute action URLs from the incoming request.

It accepts real Express `req` / `res` objects structurally, so it adds **no runtime dependency** on Express (declared as an optional peer).

## Install

```sh
npm install @affordant/server @affordant/express
```

## Usage

```ts
import { resource } from '@affordant/server'
import { sendResource, urlFor } from '@affordant/express'

app.get('/orders/:id', (req, res) => {
  const order = loadOrder(req.params.id)

  sendResource(
    res,
    resource(order)
      .self(urlFor(req, `/orders/${order.id}`))
      .action('cancel', urlFor(req, `/orders/${order.id}/cancel`), {
        method: 'POST',
        when: req.user?.id === order.ownerId && order.status !== 'shipped',
      }),
  )
})
```

## API

| Export | Description |
|---|---|
| `urlFor(req, path)` | Absolute URL for `path` from the request's protocol + Host. |
| `sendResource(res, builder)` | Build the envelope, emit a `Link: …; rel="self"` header, send JSON. Returns `res`. |

## License

MIT

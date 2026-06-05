# @affordant/contract

The shared **wire contract** for [Affordant](https://leroy-florian.github.io/Affordant/): the TypeScript types that describe the `_self` / `_actions` hypermedia envelope.

Both sides of the wire depend on this package so they can never drift apart — the server builds what the client consumes.

- [`affordant`](https://www.npmjs.com/package/affordant) (client) consumes the envelope.
- `@affordant/server` produces it.

Zero runtime, zero dependencies — it ships only `.d.ts` plus an empty module.

```ts
import type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
```

## License

MIT

# Why REST level 3

Most APIs that call themselves "RESTful" stop at **level 2** of the [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html): resources with sensible URLs and correct HTTP verbs. Level 3 — **hypermedia controls (HATEOAS)** — is the one teams skip. This page is the factual case for crossing that line, and what it changes for the way you build and run frontends.

## The four levels, in one breath

- **Level 0** — one endpoint, one verb. RPC tunnelled over HTTP.
- **Level 1** — resources. `/orders/8f3a2c` instead of `/api?do=getOrder`.
- **Level 2** — verbs and status codes. `GET`, `POST`, `DELETE`, `200`, `404`, `409`.
- **Level 3** — hypermedia controls. The response tells the client *what it can do next* — the available transitions travel with the data.

Levels 0→2 are about addressing and transport. Level 3 is about **control**: the server stops returning only state and starts returning state *plus the set of actions valid on it right now*.

## Why teams stop at level 2

Because level 2 already "works". The frontend knows the URL templates, knows the verbs, hardcodes them, and ships. The cost is invisible at first — then it compounds:

- Every authorization rule on the server is **re-implemented** on the client ("only the owner can cancel", "can't cancel once shipped"). Two copies of one rule, drifting.
- Routes and verbs are **baked into the frontend**. Rename or move an endpoint and you ship a frontend release to match.
- The UI guesses domain state. A button is shown, the user clicks, the server answers `409 Conflict` — the frontend was a step behind reality.

These aren't bugs in the code. They're a consequence of *where the knowledge lives*.

## The DDD framing

In domain-driven design, an aggregate owns its invariants and its **state machine**: which transitions are legal depends on the aggregate's current state and the caller's role. `cancel` is legal on a `pending` order owned by the caller; it is meaningless on a `shipped` one.

Level 2 leaks that state machine across the wire: the backend enforces it, and the frontend *re-derives* it to decide whether to show a button. The transition rules of a single aggregate now live in two codebases, in two languages, maintained by two teams.

Level 3 keeps the state machine where it belongs. **An affordance is a domain transition, made explicit on the wire.** The server computes the legal transitions for *this* aggregate, in *this* state, for *this* caller — and emits exactly those. The frontend reads them. The ubiquitous language (`cancel`, `publish`, `refund`) travels as `rel` names instead of being re-encoded as client-side `if` branches.

```jsonc
// GET /orders/8f3a2c — a pending order, owned by the caller
{
  "id": "8f3a2c",
  "status": "pending",
  "_actions": {
    "cancel": { "href": "/orders/8f3a2c/cancel", "method": "POST" },
    "refund": { "href": "/orders/8f3a2c/refund", "method": "POST" }
  }
}
// once shipped, the same call simply omits "cancel" — the transition is gone
```

The client never asks "is this order cancellable?". It asks "did the server offer `cancel`?" — and the answer is authoritative by construction.

## What changes for the frontend

This is the factual payoff. Crossing to level 3 changes how a frontend is built and maintained:

- **Authorization and business rules live once.** The presence of a link *is* the permission. The frontend stops carrying a second, drifting copy of the server's rules.
- **No hardcoded URLs or verbs.** `href` and `method` come from the response. Reshape your routing and clients follow without a release.
- **The UI tracks domain state by construction.** When a transition becomes illegal, the rel disappears and the control with it — no stale buttons, far fewer `409`-after-click surprises.
- **Fewer frontend deploys.** Authorization changes, state-machine changes, and feature flags become server-side decisions. The frontend already renders whatever it's handed.
- **Smaller blast radius.** A backend change can't silently break a frontend assumption that no longer exists — the assumption was deleted along with the duplication.

The trade is real but small: responses carry a little more metadata, and the frontend gives up *knowing* the API in exchange for *reading* it. In return you delete an entire category of front/back drift bugs.

## Where Affordant fits

Affordant is the machinery for level 3 on both sides of the wire, over [one shared contract](/guide/wire-contract):

- [`@affordant/server`](/reference/server) emits the affordances, gating each transition on authoritative state — where your domain rules already live.
- [`affordant`](/reference/api) reads them on the client: `can` / `actionFor` / `follow`.
- [`@affordant/react`](/reference/react) wraps those as hooks.

You don't adopt a framework to reach level 3 — you adopt a convention. Affordant just makes the convention typed, symmetric, and hard to let drift.

## Next steps

- See [the wire contract](/guide/wire-contract) for the exact envelope.
- Read [server side](/guide/server-side) to emit affordances from authoritative state.
- Browse [framework usage](/guide/frameworks) for rendering off `can()`.

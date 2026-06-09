# Playground

A full order, lifecycle and all, running **in your browser** on the real
`@affordant/server` and `@affordant/vue` packages — no API to deploy. The order
moves through its state machine (`pending → paid → shipped → delivered`, plus
`cancelled` / `refunded`), and **every action is gated on state *and* role**.

Switch who you are and act on the order. Watch the buttons — and the `_actions`
block in the live wire on the right — appear and disappear as the server
recomputes the legal transitions for *this* state and *this* caller. Nothing is
hidden by client-side logic: an action you don't see was never offered.

<AffordancePlayground />

## What to try

- As the **customer**, `pay` the order, then notice `cancel` survives into
  `paid` but `pay` and `applyCoupon` are gone — the state moved on.
- Switch to **support**: now `ship`, `refund`, and `addNote` appear, while the
  customer-only transitions vanish. Same order, different caller.
- As a **guest**, almost everything disappears: you can only `track` a shipped
  order or `contactSupport`. Authorization *is* the presence of the link.
- Drive it to `delivered`, then `requestReturn` or `reorder`; or `refund` it
  and watch the action set collapse to the terminal handful.

Every one of those rules lives in exactly one place — the server's `when` —
[just like the wire contract describes](/guide/wire-contract). The frontend
renders whatever it's handed.

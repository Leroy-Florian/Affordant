---
"@affordant/server": minor
---

Add `policy` — a single source of truth for authorization.

An affordance gates the UI's *visibility*, never the server's *behaviour*: a
client can recreate a hidden button or forge the request, so every
state-changing handler must re-check the rule. `policy(rel, rules)` declares
that rule once and uses it on both sides — `policy.granted(ctx)` (or the new
`ResourceBuilder.offer(policy, href, ctx, opts?)`) gates the affordance, while
`policy.check(ctx)` / `policy.authorize(ctx)` enforce it in the handler — so the
button and the guard can no longer drift. Rules are evaluated in order and
report the first failure, keeping distinct statuses (e.g. `403` vs `409`).

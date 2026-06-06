# Smoke test — published artifacts

While [`../demo`](../demo) tests the workspace **sources**, this verifies the **published npm packages** actually work for a real consumer.

`run.mjs` creates a throwaway project in a temp dir *outside* this repo, installs the latest published `affordant`, `@affordant/server`, `@affordant/express`, and `@affordant/effect` from the real registry, copies `check.mjs` in, and runs it. That exercises the real published tarballs — `dist` files, `"exports"` maps, dependency closure — independently of the workspace.

```sh
npm run smoke       # from the repo root
```

It rebuilds the demo server and replays the flow with the published client and Effect invoker, asserting the affordance contract. Also wired as a manual / weekly GitHub Actions job ([`.github/workflows/smoke.yml`](../.github/workflows/smoke.yml)) to catch a broken release.

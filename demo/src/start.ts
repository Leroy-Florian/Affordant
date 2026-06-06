import { actionFor, can } from 'affordant'
import { startServer as startExpress } from './server/express.js'
import { startServer as startNode } from './server/node.mjs'

// `tsx src/start.ts [express|node] [port]` (or BACKEND / PORT env).
const which = process.argv[2] ?? process.env.BACKEND ?? 'express'
const port = Number(process.argv[3] ?? process.env.PORT ?? 8787)
const start = which === 'node' ? startNode : startExpress

const { url } = await start(port)
console.log(`Affordant demo — ${which} backend running at ${url}\n`)

// Best-effort console preview. A failed self-probe must never take the server
// down (some setups reject the immediate loopback connect, e.g. EADDRNOTAVAIL).
try {
  const headers = { authorization: 'Bearer u1' }
  const anon = await fetch(`${url}/orders/8f3a2c`).then((r) => r.json())
  const owner = await fetch(`${url}/orders/8f3a2c`, { headers }).then((r) => r.json())
  console.log(`anonymous → can(cancel) = ${can(anon, 'cancel')}`)
  console.log(`owner     → can(cancel) = ${can(owner, 'cancel')}  ${JSON.stringify(actionFor(owner, 'cancel'))}\n`)
} catch {
  // ignore — the server is up regardless
}

console.log('Try it:')
console.log(`  curl ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -H 'authorization: Bearer u1' ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -X POST -H 'authorization: Bearer u1' ${url}/orders/8f3a2c/cancel | jq ._actions`)
console.log('\nPress Ctrl+C to stop.')


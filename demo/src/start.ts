import { actionFor, can } from 'affordant'
import { startServer as startExpress } from './server/express.js'
import { startServer as startNode } from './server/node.mjs'

// `tsx src/start.ts [express|node]` (or BACKEND=node). PORT defaults to 8787
// so the browser demos in web/ can point at a stable origin.
const which = process.argv[2] ?? process.env.BACKEND ?? 'express'
const port = Number(process.env.PORT ?? 8787)
const start = which === 'node' ? startNode : startExpress

const { url } = await start(port)

const anon = await fetch(`${url}/orders/8f3a2c`).then((r) => r.json())
const owner = await fetch(`${url}/orders/8f3a2c`, {
  headers: { authorization: 'Bearer u1' },
}).then((r) => r.json())

console.log(`Affordant demo — ${which} backend running at ${url}\n`)
console.log(`anonymous → can(cancel) = ${can(anon, 'cancel')}`)
console.log(`owner     → can(cancel) = ${can(owner, 'cancel')}  ${JSON.stringify(actionFor(owner, 'cancel'))}\n`)
console.log('Try it:')
console.log(`  curl ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -H 'authorization: Bearer u1' ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -X POST -H 'authorization: Bearer u1' ${url}/orders/8f3a2c/cancel | jq ._actions`)
console.log('\nPress Ctrl+C to stop.')

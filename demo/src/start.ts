import { startServer as startExpress } from './server/express.js'
import { startServer as startNode } from './server/node.mjs'

// `tsx src/start.ts [express|node] [port]` (or BACKEND / PORT env).
const which = process.argv[2] ?? process.env.BACKEND ?? 'express'
const port = Number(process.argv[3] ?? process.env.PORT ?? 8787)
const start = which === 'node' ? startNode : startExpress

const { url } = await start(port)

console.log(`Affordant demo — ${which} backend running at ${url}\n`)
console.log('Try it:')
console.log(`  curl ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -H 'authorization: Bearer u1' ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -X POST -H 'authorization: Bearer u1' ${url}/orders/8f3a2c/cancel | jq ._actions`)
console.log('\nPress Ctrl+C to stop.')

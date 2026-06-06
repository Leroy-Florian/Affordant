import { can, actionFor } from 'affordant'
import { startServer } from './server.js'

/**
 * Launch the demo server and print a couple of curl commands that show the
 * affordance-first contract in action: the `cancel` link only appears for the
 * authenticated owner.
 */
const { url } = await startServer()

// Show the difference between anonymous and owner views, server-side.
const anon = await fetch(`${url}/orders/8f3a2c`).then((r) => r.json())
const owner = await fetch(`${url}/orders/8f3a2c`, {
  headers: { authorization: 'Bearer u1' },
}).then((r) => r.json())

console.log(`Affordant demo server running at ${url}\n`)
console.log(`anonymous → can(cancel) = ${can(anon, 'cancel')}`)
console.log(`owner     → can(cancel) = ${can(owner, 'cancel')}  ${JSON.stringify(actionFor(owner, 'cancel'))}\n`)
console.log('Try it:')
console.log(`  curl ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -H 'authorization: Bearer u1' ${url}/orders/8f3a2c | jq ._actions`)
console.log(`  curl -X POST -H 'authorization: Bearer u1' ${url}/orders/8f3a2c/cancel | jq ._actions`)
console.log('\nPress Ctrl+C to stop.')

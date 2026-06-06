import { startServer as startExpress, type RunningServer } from '../src/server/express.js'
import { startServer as startNode } from '../src/server/node.mjs'

/** The two backends, both emitting the same wire contract. */
export const backends: ReadonlyArray<{ name: string; start: () => Promise<RunningServer> }> = [
  { name: 'express', start: () => startExpress() },
  { name: 'node (100% JS)', start: () => startNode() },
]

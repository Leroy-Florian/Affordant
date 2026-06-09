// Frees the demo's ports before `npm run dev`, so a leftover process from a
// previous run (common on Windows, where child processes can outlive the
// parent) doesn't cause EADDRINUSE. Best-effort: never throws.
import { execSync } from 'node:child_process'

const ports = [8787, 8788, 5173]

for (const port of ports) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano -p tcp | findstr :${port}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString()
      const pids = new Set(
        out
          .split('\n')
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && pid !== '0'),
      )
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        } catch {
          /* already gone */
        }
      }
    } else {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore' })
    }
  } catch {
    /* nothing listening on this port — fine */
  }
}

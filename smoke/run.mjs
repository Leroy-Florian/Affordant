// Orchestrates the published-artifacts smoke test.
//
// It builds a throwaway project in a temp dir OUTSIDE this repo, installs the
// packages from the real npm registry (latest published versions), copies
// check.mjs in, and runs it. This proves the published tarballs — dist files,
// "exports" maps, dependency closure — actually work for a real consumer,
// independently of the workspace sources.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'affordant-smoke-'))

const pkg = {
  name: 'affordant-smoke',
  private: true,
  type: 'module',
  dependencies: {
    affordant: 'latest',
    '@affordant/server': 'latest',
    '@affordant/express': 'latest',
    '@affordant/effect': 'latest',
    effect: '^3.21.0',
    express: '^5.0.0',
  },
}

try {
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2))
  cpSync(join(here, 'check.mjs'), join(dir, 'check.mjs'))

  console.log(`Installing published packages into ${dir} ...`)
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], {
    cwd: dir,
    stdio: 'inherit',
  })

  console.log('Running smoke check against published artifacts ...')
  execFileSync('node', ['check.mjs'], { cwd: dir, stdio: 'inherit' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}

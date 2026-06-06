type Resource = { name: string; kind: 'backend' | 'front'; href: string; health?: string }

const resources: Resource[] = [
  { name: 'Express API', kind: 'backend', href: 'http://localhost:8787/orders/8f3a2c', health: 'http://localhost:8787/health' },
  { name: 'Node API (100% JS)', kind: 'backend', href: 'http://localhost:8788/orders/8f3a2c', health: 'http://localhost:8788/health' },
  { name: 'React front', kind: 'front', href: '/react.html' },
  { name: 'Vanilla JS front', kind: 'front', href: '/vanilla.html' },
]

const rows = document.getElementById('rows')!
rows.innerHTML = resources
  .map(
    (r, i) =>
      `<tr><td><span class="dot" id="dot${i}"></span></td><td>${r.name}</td><td>${r.kind}</td>` +
      `<td><a href="${r.href}" target="_blank" rel="noreferrer">open ↗</a></td></tr>`,
  )
  .join('')

async function isUp(r: Resource): Promise<boolean> {
  if (!r.health) return true // fronts are served by this very page's dev server
  try {
    return (await fetch(r.health, { cache: 'no-store' })).ok
  } catch {
    return false
  }
}

async function refresh() {
  await Promise.all(
    resources.map(async (r, i) => {
      const dot = document.getElementById(`dot${i}`)!
      const up = await isUp(r)
      dot.classList.toggle('up', up)
      dot.classList.toggle('down', !up)
    }),
  )
}

void refresh()
setInterval(refresh, 2000)

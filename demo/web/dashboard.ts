import './styles.css'
import { backends } from './backends.js'
import { getLang, setLang, T, type Lang } from './i18n.js'

type Row = { name: string; kind: 'backend' | 'front'; href: string; health?: string; logo?: string }

const $ = (id: string) => document.getElementById(id)!

function build(lang: Lang): Row[] {
  const t = T[lang]
  return [
    ...backends.map(
      (b): Row => ({
        name: `${b.label} API`,
        kind: 'backend',
        href: `${b.url}/orders/8f3a2c`,
        health: `${b.url}/health`,
        logo: b.logo,
      }),
    ),
    { name: t.reactTitle, kind: 'front', href: '/react.html' },
    { name: t.vanillaTitle, kind: 'front', href: '/vanilla.html' },
  ]
}

let resources: Row[] = []

function render(lang: Lang) {
  const t = T[lang]
  $('title').innerHTML = `Affordant <span class="sub">· ${t.dashboardTitle}</span>`
  $('lede').textContent = t.dashLede
  $('th-status').textContent = t.colStatus
  $('th-service').textContent = t.colService
  $('th-kind').textContent = t.colKind

  $('lang').innerHTML = (['fr', 'en'] as const)
    .map((l) => `<button data-lang="${l}" class="${l === lang ? 'active' : ''}">${l.toUpperCase()}</button>`)
    .join('')
  for (const btn of $('lang').querySelectorAll('button')) {
    btn.addEventListener('click', () => {
      const l = (btn as HTMLElement).dataset.lang as Lang
      setLang(l)
      render(l)
    })
  }

  resources = build(lang)
  $('rows').innerHTML = resources
    .map(
      (r, i) =>
        `<tr>` +
        `<td><span class="dot" id="dot${i}"></span></td>` +
        `<td><span class="svc">${r.logo ? `<img class="logo" src="${r.logo}" alt="" />` : ''}${r.name}</span></td>` +
        `<td class="kind">${r.kind === 'backend' ? t.kindBackend : t.kindFront}</td>` +
        `<td><a href="${r.href}" target="_blank" rel="noreferrer">${t.open}</a></td>` +
        `</tr>`,
    )
    .join('')

  void refresh()
}

async function isUp(r: Row): Promise<boolean> {
  if (!r.health) return true
  try {
    return (await fetch(r.health, { cache: 'no-store' })).ok
  } catch {
    return false
  }
}

async function refresh() {
  await Promise.all(
    resources.map(async (r, i) => {
      const dot = document.getElementById(`dot${i}`)
      if (!dot) return
      const up = await isUp(r)
      dot.classList.toggle('up', up)
      dot.classList.toggle('down', !up)
    }),
  )
}

render(getLang())
setInterval(refresh, 2000)

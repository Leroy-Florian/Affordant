import './styles.css'
import 'highlight.js/styles/github-dark.css'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import { actionFor, can, follow, type HateoasResource } from 'affordant'
import { backends } from './backends.js'
import { getLang, setLang, T, type Lang } from './i18n.js'

hljs.registerLanguage('javascript', javascript)

// How this front consumes the contract — shown in the "Front" pane.
const FRONT_CODE = `// Vanilla — affordant
if (can(order, 'cancel')) {
  const button = document.createElement('button')
  button.textContent = 'Cancel'
  button.onclick = () => follow(actionFor(order, 'cancel'), { token })
  out.appendChild(button)
}`

type Order = { id: string; status: string }

let lang = getLang()

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const select = el<HTMLSelectElement>('backend')
const logo = el<HTMLImageElement>('logo')
const ownerBox = el<HTMLInputElement>('owner')
const out = el<HTMLDivElement>('out')
const controller = el<HTMLPreElement>('controller')
const response = el<HTMLPreElement>('response')

for (const b of backends) {
  const option = document.createElement('option')
  option.value = b.id
  option.textContent = `${b.label} — ${b.url}`
  select.appendChild(option)
}

const current = () => backends.find((b) => b.id === select.value) ?? backends[0]!

function chrome() {
  const t = T[lang]
  el('title').innerHTML = `Affordant <span class="sub">· ${t.vanillaTitle}</span>`
  el('lede').textContent = t.vanillaLede
  el('api-label').textContent = t.api
  el('owner-label').textContent = t.owner
  el('front-title').textContent = `${t.front} · Vanilla`
  el('front').innerHTML = `<code class="hljs language-javascript">${
    hljs.highlight(FRONT_CODE, { language: 'javascript' }).value
  }</code>`
  el('response-title').textContent = t.response
  el('nav-dashboard').textContent = t.navDashboard
  el('nav-react').textContent = t.navReact
  el('lang').innerHTML = (['fr', 'en'] as const)
    .map((l) => `<button data-lang="${l}" class="${l === lang ? 'active' : ''}">${l.toUpperCase()}</button>`)
    .join('')
  for (const btn of el('lang').querySelectorAll('button')) {
    btn.addEventListener('click', () => {
      lang = (btn as HTMLElement).dataset.lang as Lang
      setLang(lang)
      chrome()
      void render()
    })
  }
}

async function render() {
  const t = T[lang]
  const backend = current()
  logo.src = backend.logo
  el('controller-title').textContent = `${t.controller} (${backend.label})`
  controller.innerHTML = `<code class="hljs language-javascript">${
    hljs.highlight(backend.controller, { language: 'javascript' }).value
  }</code>`

  const token = ownerBox.checked ? 'u1' : undefined
  const order: HateoasResource<Order> = await fetch(
    `${backend.url}/orders/8f3a2c`,
    token ? { headers: { authorization: `Bearer ${token}` } } : undefined,
  ).then((r) => r.json())

  response.textContent = JSON.stringify(order, null, 2)
  out.innerHTML =
    `<div class="order"><span>${t.order} ${order.id}</span>` +
    `<span class="badge badge-${order.status}" data-testid="status">${order.status}</span></div>`

  if (can(order, 'cancel')) {
    const button = document.createElement('button')
    button.className = 'action'
    button.textContent = t.cancel
    button.onclick = async () => {
      await follow(actionFor(order, 'cancel')!, { token })
      render()
    }
    out.querySelector('.order')!.appendChild(button)
  }
}

select.addEventListener('change', render)
ownerBox.addEventListener('change', render)
chrome()
void render()

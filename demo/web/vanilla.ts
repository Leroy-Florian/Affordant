import './styles.css'
import { actionFor, can, follow, type HateoasResource } from 'affordant'
import { backends } from './backends.js'

type Order = { id: string; status: string }

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const select = el<HTMLSelectElement>('backend')
const logo = el<HTMLImageElement>('logo')
const ownerBox = el<HTMLInputElement>('owner')
const out = el<HTMLDivElement>('out')
const controller = el<HTMLPreElement>('controller')
const controllerTitle = el<HTMLHeadingElement>('controller-title')
const response = el<HTMLPreElement>('response')

for (const b of backends) {
  const option = document.createElement('option')
  option.value = b.id
  option.textContent = `${b.label} — ${b.url}`
  select.appendChild(option)
}

const current = () => backends.find((b) => b.id === select.value) ?? backends[0]!

async function render() {
  const backend = current()
  logo.src = backend.logo
  controllerTitle.textContent = `Controller (${backend.label})`
  controller.textContent = backend.controller

  const token = ownerBox.checked ? 'u1' : undefined
  const order: HateoasResource<Order> = await fetch(
    `${backend.url}/orders/8f3a2c`,
    token ? { headers: { authorization: `Bearer ${token}` } } : undefined,
  ).then((r) => r.json())

  response.textContent = JSON.stringify(order, null, 2)
  out.innerHTML =
    `<div class="order"><span>Order ${order.id}</span>` +
    `<span class="badge badge-${order.status}" data-testid="status">${order.status}</span></div>`

  if (can(order, 'cancel')) {
    const button = document.createElement('button')
    button.className = 'action'
    button.textContent = 'Cancel'
    button.onclick = async () => {
      await follow(actionFor(order, 'cancel')!, { token })
      render()
    }
    out.querySelector('.order')!.appendChild(button)
  }
}

select.addEventListener('change', render)
ownerBox.addEventListener('change', render)
void render()

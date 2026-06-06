import { actionFor, can, follow, type HateoasResource } from 'affordant'

type Order = { id: string; status: string }

const el = (id: string) => document.getElementById(id)!
const base = () => (el('base') as HTMLInputElement).value
const token = () => ((el('owner') as HTMLInputElement).checked ? 'u1' : undefined)

async function render() {
  const t = token()
  const order: HateoasResource<Order> = await fetch(
    `${base()}/orders/8f3a2c`,
    t ? { headers: { authorization: `Bearer ${t}` } } : undefined,
  ).then((r) => r.json())

  const out = el('out')
  out.innerHTML = `<p>Order ${order.id} — <strong>${order.status}</strong></p>`

  if (can(order, 'cancel')) {
    const button = document.createElement('button')
    button.textContent = 'Cancel'
    button.onclick = async () => {
      await follow(actionFor(order, 'cancel')!, { token: t })
      render()
    }
    out.appendChild(button)
  }
}

el('load').addEventListener('click', render)

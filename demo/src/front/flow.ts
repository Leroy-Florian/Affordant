// The vanilla (framework-less) front: plain functions over the client.
import { actionFor, can, follow, type HateoasResource } from 'affordant'

export type Order = { id: string; total: number; status: string }

export function loadOrder(baseUrl: string, token?: string): Promise<HateoasResource<Order>> {
  return fetch(
    `${baseUrl}/orders/8f3a2c`,
    token ? { headers: { authorization: `Bearer ${token}` } } : undefined,
  ).then((r) => r.json() as Promise<HateoasResource<Order>>)
}

export function cancelOrder(order: HateoasResource<Order>, token: string): Promise<Response> {
  const action = actionFor(order, 'cancel')
  if (!action) throw new Error('cancel is not offered')
  return follow(action, { token })
}

export { can, actionFor, follow }

// The React front: gate the Cancel button on the server's affordance.
import { useCallback, useEffect, useState } from 'react'
import { useAffordance, useFollow, type HateoasResource } from '@affordant/react'

type Order = { id: string; total: number; status: string }

export function OrderCard({
  baseUrl,
  token,
  onLoaded,
}: {
  baseUrl: string
  token?: string
  /** Called with each freshly loaded resource — lets a parent show the raw response. */
  onLoaded?: (order: HateoasResource<Order>) => void
}) {
  const [order, setOrder] = useState<HateoasResource<Order> | null>(null)

  const load = useCallback(() => {
    fetch(`${baseUrl}/orders/8f3a2c`, token ? { headers: { authorization: `Bearer ${token}` } } : undefined)
      .then((r) => r.json())
      .then((o: HateoasResource<Order>) => {
        setOrder(o)
        onLoaded?.(o)
      })
  }, [baseUrl, token, onLoaded])

  useEffect(load, [load])

  const cancel = useAffordance(order, 'cancel')
  const { run, running } = useFollow()

  if (!order) return <p>Loading…</p>

  return (
    <div>
      <p>
        Order {order.id} — <strong data-testid="status">{order.status}</strong>
      </p>
      {cancel.can && (
        <button
          disabled={running}
          onClick={async () => {
            await run(cancel.action!, { token })
            load()
          }}
        >
          Cancel
        </button>
      )}
    </div>
  )
}

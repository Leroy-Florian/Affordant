// The React front: gate the Cancel button on the server's affordance.
import { useCallback, useEffect, useState } from 'react'
import { useAffordance, useFollow, type HateoasResource } from '@affordant/react'

type Order = { id: string; total: number; status: string }

export function OrderCard({ baseUrl, token }: { baseUrl: string; token?: string }) {
  const [order, setOrder] = useState<HateoasResource<Order> | null>(null)

  const load = useCallback(() => {
    fetch(`${baseUrl}/orders/8f3a2c`, token ? { headers: { authorization: `Bearer ${token}` } } : undefined)
      .then((r) => r.json())
      .then(setOrder)
  }, [baseUrl, token])

  useEffect(load, [load])

  const cancel = useAffordance(order, 'cancel')
  const { run, running } = useFollow()

  if (!order) return <p>Loading…</p>

  return (
    <div>
      <p>
        Order {order.id} — <strong>{order.status}</strong>
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

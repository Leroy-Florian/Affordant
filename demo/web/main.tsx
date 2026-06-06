import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { HateoasResource } from '@affordant/react'
import { OrderCard } from '../src/front/OrderCard.js'
import { backends } from './backends.js'

const pre: React.CSSProperties = {
  background: '#0b1021',
  color: '#e2e8f0',
  padding: '0.75rem 1rem',
  borderRadius: 8,
  overflow: 'auto',
  fontSize: 12,
  lineHeight: 1.45,
  margin: 0,
}

function App() {
  const [backendId, setBackendId] = useState(backends[0]!.id)
  const [owner, setOwner] = useState(false)
  const [response, setResponse] = useState<HateoasResource<{ id: string }> | null>(null)

  const backend = backends.find((b) => b.id === backendId)!

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 880, margin: '2rem auto', lineHeight: 1.5 }}>
      <h1>Affordant — React front</h1>
      <p>
        The <code>Cancel</code> button appears only when the server offers the affordance. Pick an
        API, toggle the owner, and watch the controller's <code>when</code> flip the link in the
        live response — and the button with it.
      </p>

      <p style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          API
          <img src={backend.logo} alt="" width={20} height={20} />
          <select value={backendId} onChange={(e) => setBackendId(e.target.value)}>
            {backends.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label} — {b.url}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={owner} onChange={(e) => setOwner(e.target.checked)} />
          Authenticated as owner (u1)
        </label>
      </p>

      <OrderCard
        key={`${backend.url}:${owner}`}
        baseUrl={backend.url}
        token={owner ? 'u1' : undefined}
        onLoaded={setResponse}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
        <section>
          <h3>Controller ({backend.label})</h3>
          <pre style={pre}>{backend.controller}</pre>
        </section>
        <section>
          <h3>Response</h3>
          <pre style={pre} data-testid="response">
            {response ? JSON.stringify(response, null, 2) : '…'}
          </pre>
        </section>
      </div>

      <p style={{ marginTop: '1.5rem' }}>
        <a href="/">← Dashboard</a> · <a href="/vanilla.html">Vanilla JS front →</a>
      </p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

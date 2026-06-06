import './styles.css'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { HateoasResource } from '@affordant/react'
import { OrderCard } from '../src/front/OrderCard.js'
import { backends } from './backends.js'

function App() {
  const [backendId, setBackendId] = useState(backends[0]!.id)
  const [owner, setOwner] = useState(false)
  const [response, setResponse] = useState<HateoasResource<{ id: string }> | null>(null)

  const backend = backends.find((b) => b.id === backendId)!

  return (
    <div className="container">
      <h1>Affordant <span className="sub">· React front</span></h1>
      <p className="lede">
        The <code>Cancel</code> button appears only when the server offers the affordance. Pick an
        API, toggle the owner, and watch the controller's <code>when</code> flip the link in the live
        response — and the button with it.
      </p>

      <div className="card">
        <div className="controls">
          <label className="field">
            API
            <img className="logo" src={backend.logo} alt="" />
            <select value={backendId} onChange={(e) => setBackendId(e.target.value)}>
              {backends.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} — {b.url}
                </option>
              ))}
            </select>
          </label>
          <label className="switch">
            <input type="checkbox" checked={owner} onChange={(e) => setOwner(e.target.checked)} />
            Authenticated as owner (u1)
          </label>
        </div>

        <OrderCard
          key={`${backend.url}:${owner}`}
          baseUrl={backend.url}
          token={owner ? 'u1' : undefined}
          onLoaded={setResponse}
        />

        <div className="panes">
          <div className="pane">
            <h3>Controller · {backend.label}</h3>
            <pre>{backend.controller}</pre>
          </div>
          <div className="pane">
            <h3>Response</h3>
            <pre data-testid="response">{response ? JSON.stringify(response, null, 2) : '…'}</pre>
          </div>
        </div>
      </div>

      <nav className="nav">
        <a href="/">← Dashboard</a>
        <a href="/vanilla.html">Vanilla JS front →</a>
      </nav>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

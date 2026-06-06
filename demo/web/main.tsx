import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { OrderCard } from '../src/front/OrderCard.js'

const DEFAULT_BACKEND = 'http://localhost:8787'

function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BACKEND)
  const [owner, setOwner] = useState(false)

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '2rem auto', lineHeight: 1.5 }}>
      <h1>Affordant — React front</h1>
      <p>
        The <code>Cancel</code> button appears only when the server offers the affordance — i.e. the
        authenticated owner of a pending order. Toggle the checkbox to see it appear and disappear.
      </p>
      <p>
        <label>
          Backend{' '}
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} size={30} />
        </label>
      </p>
      <p>
        <label>
          <input type="checkbox" checked={owner} onChange={(e) => setOwner(e.target.checked)} />{' '}
          Authenticated as owner (u1)
        </label>
      </p>
      <OrderCard key={`${baseUrl}:${owner}`} baseUrl={baseUrl} token={owner ? 'u1' : undefined} />
      <p>
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

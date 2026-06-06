import './styles.css'
import 'highlight.js/styles/github-dark.css'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import type { HateoasResource } from '@affordant/react'
import { OrderCard } from '../src/front/OrderCard.js'
import { backends } from './backends.js'
import { getLang, setLang, T, type Lang } from './i18n.js'

hljs.registerLanguage('javascript', javascript)
const highlight = (code: string) => hljs.highlight(code, { language: 'javascript' }).value

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="lang">
      {(['fr', 'en'] as const).map((l) => (
        <button key={l} className={l === lang ? 'active' : ''} onClick={() => onChange(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function App() {
  const [lang, setLangState] = useState<Lang>(getLang())
  const [backendId, setBackendId] = useState(backends[0]!.id)
  const [owner, setOwner] = useState(false)
  const [response, setResponse] = useState<HateoasResource<{ id: string }> | null>(null)

  const t = T[lang]
  const backend = backends.find((b) => b.id === backendId)!
  const changeLang = (l: Lang) => {
    setLang(l)
    setLangState(l)
  }

  return (
    <div className="container">
      <div className="header">
        <h1>
          Affordant <span className="sub">· {t.reactTitle}</span>
        </h1>
        <LangSwitch lang={lang} onChange={changeLang} />
      </div>
      <p className="lede">{t.reactLede}</p>

      <div className="card">
        <div className="controls">
          <label className="field">
            {t.api}
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
            {t.owner}
          </label>
        </div>

        <OrderCard
          key={`${backend.url}:${owner}`}
          baseUrl={backend.url}
          token={owner ? 'u1' : undefined}
          onLoaded={setResponse}
          orderLabel={t.order}
          cancelLabel={t.cancel}
        />

        <div className="panes">
          <div className="pane">
            <h3>{t.controller} · {backend.label}</h3>
            <pre className="code">
              <code
                className="hljs language-javascript"
                dangerouslySetInnerHTML={{ __html: highlight(backend.controller) }}
              />
            </pre>
          </div>
          <div className="pane">
            <h3>{t.response}</h3>
            <pre className="json" data-testid="response">
              {response ? JSON.stringify(response, null, 2) : '…'}
            </pre>
          </div>
        </div>
      </div>

      <nav className="nav">
        <a href="/">{t.navDashboard}</a>
        <a href="/vanilla.html">{t.navVanilla}</a>
      </nav>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

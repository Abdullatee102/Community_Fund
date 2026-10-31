import { useEffect, useState } from 'react'

import Header from './components/Header'
import HomePage from './pages/HomePage'
import Guidelines from './pages/Guidelines'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isGuidelines, setIsGuidelines] = useState(
    window.location.hash === '#guidelines',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleHashChange = () => {
      setIsGuidelines(window.location.hash === '#guidelines')
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={() =>
          setTheme((currentTheme) =>
            currentTheme === 'light' ? 'dark' : 'light',
          )
        }
      />

      {isGuidelines ? <Guidelines /> : <HomePage />}

      <footer className="site-footer">
        <div className="footer-col brand-col">
          <span className="footer-brand">BotCommunityFund</span>
          <span className="footer-network">BotChain Mainnet · Chain 677</span>
        </div>

        <div className="footer-col ecosystem-col">
          <div className="ecosystem-badge">
            <img
              src="/favicon.svg"
              alt="BOT Chain Logo"
              className="botchain-logo"
              width="16"
              height="16"
            />
            <span className="botchain-name">BOT Chain</span>
          </div>

          <div className="ecosystem-links">
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              title="BOT Chain Official Website"
            >
              BOT Chain Website ↗
            </a>
            <span className="footer-divider" aria-hidden="true">·</span>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              title="BOT Chain Blockchain Explorer"
            >
              BOT Chain Explorer ↗
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App

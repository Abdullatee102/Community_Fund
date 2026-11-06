import { useEffect, useState } from 'react'
import './App.css'

import Header from './components/Header'
import HomePage from './pages/HomePage'
import Guidelines from './pages/Guidelines'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('botcommunityfund-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  const [isGuidelines, setIsGuidelines] = useState(
    window.location.hash === '#guidelines',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('botcommunityfund-theme', theme)
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
            <div className="ecosystem-link-item">
              <span className="ecosystem-link-label">BOT Chain website:</span>
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                https://botchain.ai
              </a>
            </div>

            <div className="ecosystem-link-item">
              <span className="ecosystem-link-label">BOT Chain explorer:</span>
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                https://scan.botchain.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App

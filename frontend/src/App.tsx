import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Guidelines from './pages/Guidelines'
import HomePage from './pages/HomePage'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('botcommunityfund-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  const [isGuidelines, setIsGuidelines] = useState(
    () => window.location.hash === '#guidelines',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('botcommunityfund-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleHashChange = () => {
      setIsGuidelines(window.location.hash === '#guidelines')
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
        <span>BotCommunityFund</span>
        <span>Bohr Testnet · Chain 968</span>
      </footer>
    </>
  )
}

export default App
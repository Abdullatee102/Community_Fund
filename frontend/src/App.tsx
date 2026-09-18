import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import HomePage from './pages/HomePage'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('botcommunityfund-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('botcommunityfund-theme', theme)
  }, [theme])

  return (
    <>
      <Header theme={theme} onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')} />
      <HomePage />
      <footer className="site-footer">
        <span>BotCommunityFund</span>
        <span>Bohr Testnet · Chain 968</span>
      </footer>
    </>
  )
}

export default App

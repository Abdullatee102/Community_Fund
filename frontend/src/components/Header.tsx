import { createElement } from 'react'
import { hasReownProjectId } from '../config/appkit'

type HeaderProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="BotCommunityFund home">
        <span className="brand-mark">B</span>
        <span>BotCommunityFund</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#funds">Explore funds</a>
        <a href="#create">Create a fund</a>
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
        {hasReownProjectId ? createElement('appkit-button') : <button className="wallet-button" type="button" disabled title="Add VITE_REOWN_PROJECT_ID to enable wallet connection">Wallet unavailable</button>}
      </nav>
    </header>
  )
}

export default Header

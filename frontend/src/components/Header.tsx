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
        <span className="brand-name">BotCommunityFund</span>
      </a>

      <nav className="site-nav" aria-label="Primary navigation">
        <a className="desktop-nav-link" href="/#fund">
          Explore funds
        </a>

        <a className="desktop-nav-link" href="/#create">
          Create a fund
        </a>

        <a className="guidelines-nav-link" href="/#guidelines">
          Guidelines
        </a>

        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${
            theme === 'light' ? 'dark' : 'light'
          } theme`}
          title={`Switch to ${
            theme === 'light' ? 'dark' : 'light'
          } theme`}
        >
          <span aria-hidden="true">
            {theme === 'light' ? '☾' : '☀'}
          </span>

          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        {hasReownProjectId ? (
          createElement('appkit-button')
        ) : (
          <button
            className="wallet-button"
            type="button"
            disabled
            title="Add VITE_REOWN_PROJECT_ID to enable wallet connection"
          >
            Wallet unavailable
          </button>
        )}
      </nav>
    </header>
  )
}

export default Header
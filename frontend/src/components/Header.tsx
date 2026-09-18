import { createElement } from 'react'
import { hasReownProjectId } from '../config/appkit'

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="BotCommunityFund home">
        <span className="brand-mark">B</span>
        <span>BotCommunityFund</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#funds">Explore funds</a>
        <a href="#create">Create a fund</a>
        {hasReownProjectId ? createElement('appkit-button') : <button className="wallet-button" type="button" disabled title="Add VITE_REOWN_PROJECT_ID to enable wallet connection">Wallet unavailable</button>}
      </nav>
    </header>
  )
}

export default Header

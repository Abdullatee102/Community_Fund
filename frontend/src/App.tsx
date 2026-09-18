import './App.css'
import Header from './components/Header'
import HomePage from './pages/HomePage'

function App() {
  return (
    <>
      <Header />
      <HomePage />
      <footer className="site-footer">
        <span>BotCommunityFund</span>
        <span>Bohr Testnet · Chain 968</span>
      </footer>
    </>
  )
}

export default App

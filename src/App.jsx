import './App.css'
import { Outlet } from 'react-router-dom'
import Main from './components/pages/Main'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Main>
        <Outlet />
      </Main>
      <Footer />
    </div>
  )
}

export default App
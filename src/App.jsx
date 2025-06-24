import './App.css'
import { Outlet } from 'react-router-dom'
import Main from './components/pages/Main'
import Header from './components/Header'
import SocialLogin from './components/pages/SocialLogin'

function App() {

  return (
    <>
      <Header />
      <Main>
        <Outlet />
      </Main>
    </>
  )
}

export default App
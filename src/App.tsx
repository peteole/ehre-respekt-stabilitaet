import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Auth from './Auth'
import Account from './Account'
import { supabase } from './client'
import { Link } from "react-router-dom";
import {
  Routes,
  Route,
} from "react-router-dom";
import Home from './Home'
import Board from './Board'

export default function App() {
  const [session, setSession] = useState(supabase?.auth?.session())

  useEffect(() => {
    setSession(supabase?.auth?.session())

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])
  return (
    <div className="container" >
      <nav
        style={{
          borderBottom: "solid 1px",
          paddingBottom: "1rem",
        }}>
        <p><Link to="/">Home</Link> | <Link to="/auth">Login</Link></p>
      </nav>
      <Routes>
        <Route path="auth" element={!session ? <Auth /> : <Account key={session?.user?.id} session={session} />} />
        <Route path="/boards"  >
          <Route path=":id" element={<Board />} />
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>

    </div>
  )
}


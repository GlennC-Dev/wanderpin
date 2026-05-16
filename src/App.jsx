import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import MapContainer from './components/map/MapContainer'
import Auth from './pages/Auth'
import Navbar from './components/layout/Navbar'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      🗺️ Loading...
    </div>
  )

  if (!session) return <Auth />

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Navbar session={session} />
      <MapContainer />
    </div>
  )
}

export default App
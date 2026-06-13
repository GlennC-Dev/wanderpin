import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import MapContainer from './components/map/MapContainer'
import Auth from './pages/Auth'
import Navbar from './components/layout/Navbar'
import SetHomeBase from './components/onboarding/SetHomeBase'
import { useHomeBase } from './hooks/useHomeBase'
import { Paths } from './pages/Paths'
import { usePinState } from './hooks/usePinState'
import { useUserLocation } from './hooks/useUserLocation'
import { useSerendipity } from './hooks/useSerendipity'

function AppInner({ session }) {
  const { homeBase, loading, saveHomeBase, clearHomeBase } = useHomeBase(session.user.id)
  const { pinStates, setPinState, pinStateRows } = usePinState(session.user.id)
  const [activeTab, setActiveTab] = useState('map')
  const [activePath, setActivePath] = useState(null)
  const [isEditingPath, setIsEditingPath] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('wp_isDark')
    return saved !== null ? saved === 'true' : true
  })
  const [hideVisited, setHideVisited] = useState(() => {
    const saved = localStorage.getItem('wp_hideVisited')
    return saved === 'true'
  })
  const [pathColor, setPathColor] = useState(() => {
    const saved = localStorage.getItem('wp_pathColor')
    if (saved === '#f1f5f9') return '#ef4444'
    return saved || '#ef4444'
  })

  useEffect(() => { localStorage.setItem('wp_isDark', isDark) }, [isDark])
  useEffect(() => { localStorage.setItem('wp_hideVisited', hideVisited) }, [hideVisited])
  useEffect(() => { localStorage.setItem('wp_pathColor', pathColor) }, [pathColor])

  const [isDropMode, setIsDropMode] = useState(false)

  const { location: userLocation } = useUserLocation()

  const { activePins, skipsRemaining, skipPin, resetToday } = useSerendipity({
    userLocation,
    activePath,
    pinStateRows,
  })

  function handleEditPath(path) {
    setActivePath(path)
    setIsEditingPath(true)
    setActiveTab('map')
  }

  function handleDoneEditing() {
    setIsEditingPath(false)
  }

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

  if (!homeBase) return <SetHomeBase onSave={saveHomeBase} />

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Navbar
        session={session}
        onResetHomeBase={clearHomeBase}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEditingPath={isEditingPath}
        activePath={activePath}
        onDoneEditing={handleDoneEditing}
        isDark={isDark}
        setIsDark={setIsDark}
        hideVisited={hideVisited}
        setHideVisited={setHideVisited}
        pathColor={pathColor}
        setPathColor={setPathColor}
        isDropMode={isDropMode}
        setIsDropMode={setIsDropMode}
        onResetSerendipity={resetToday}
      />
      {activeTab === 'map' && (
        <MapContainer
          session={session}
          isEditingPath={isEditingPath}
          activePath={activePath}
          setActivePath={setActivePath}
          isDark={isDark}
          hideVisited={hideVisited}
          pathColor={pathColor}
          isDropMode={isDropMode}
          setIsDropMode={setIsDropMode}
          pinStates={pinStates}
          setPinState={setPinState}
          serendipityPins={activePins}
          skipsRemaining={skipsRemaining}
          onSkipSerendipity={skipPin}
        />
      )}
      {activeTab === 'paths' && (
        <Paths
          user={session.user}
          activePath={activePath}
          setActivePath={setActivePath}
          onEditPath={handleEditPath}
          isDark={isDark}
        />
      )}
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
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

  return <AppInner session={session} />
}

export default App
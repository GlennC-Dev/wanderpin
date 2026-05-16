import { supabase } from '../../lib/supabase'

export default function Navbar({ session, onResetHomeBase }) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1001,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(8px)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>🗺️ WanderPin</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {session?.user?.email}
        </span>
        <button
          onClick={onResetHomeBase}
          style={{
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          🏠 Change Base
        </button>
        <button
          onClick={handleSignOut}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
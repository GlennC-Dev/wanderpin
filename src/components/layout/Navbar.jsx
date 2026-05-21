import { supabase } from '../../lib/supabase'

export default function Navbar({ session, onResetHomeBase, activeTab, setActiveTab, isEditingPath, activePath, onDoneEditing }) {
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
      background: isEditingPath ? 'rgba(59,130,246,0.97)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(8px)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'background 0.3s'
    }}>

      <span style={{ fontWeight: 'bold', fontSize: '18px', color: isEditingPath ? '#fff' : 'inherit' }}>
        🗺️ WanderPin
      </span>

      {/* Editing indicator or tab switcher */}
      {isEditingPath ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
            ✏️ Editing: {activePath?.title}
          </span>
          <button
            onClick={onDoneEditing}
            style={{
              background: '#fff',
              color: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            ✅ Done Editing
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          {['map', 'paths'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#3b82f6' : '#e2e8f0',
                color: activeTab === tab ? '#fff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'map' ? '🗺️ Map' : '📍 Paths'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: isEditingPath ? '#dbeafe' : '#666' }}>
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
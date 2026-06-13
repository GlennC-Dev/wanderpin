import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const PATH_COLORS = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Blue', value: '#3b82f6' },
]

export default function Navbar({ session, onResetHomeBase, activeTab, setActiveTab, isEditingPath, activePath, onDoneEditing, isDark, setIsDark, hideVisited, setHideVisited, pathColor, setPathColor, isDropMode, setIsDropMode, onResetSerendipity }) {
  const [showSettings, setShowSettings] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        background: isDropMode
          ? 'rgba(249,115,22,0.97)'
          : isEditingPath
            ? 'rgba(59,130,246,0.97)'
            : isDark
              ? 'rgba(15,23,42,0.97)'
              : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'background 0.3s'
      }}>
        <span style={{
          fontWeight: 'bold',
          fontSize: '18px',
          color: isDropMode || isEditingPath || isDark ? '#fff' : 'inherit'
        }}>
          🗺️ WanderPin
        </span>

        {isDropMode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
              📌 Tap anywhere on the map to drop a pin
            </span>
            <button
              onClick={() => setIsDropMode(false)}
              style={{
                background: '#fff',
                color: '#f97316',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              ✕ Cancel
            </button>
          </div>
        ) : isEditingPath ? (
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
                  background: activeTab === tab ? '#3b82f6' : isDark ? '#1e293b' : '#e2e8f0',
                  color: activeTab === tab ? '#fff' : isDark ? '#94a3b8' : '#475569',
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
            {activeTab === 'map' && (
              <button
                onClick={() => setIsDropMode(true)}
                style={{
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}
              >
                📌 Drop Pin
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: isDropMode || isEditingPath || isDark ? '#fff' : '#666' }}>
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
          <button
            onClick={() => setShowSettings(prev => !prev)}
            style={{
              background: showSettings ? '#1e293b' : 'transparent',
              color: isDropMode || isEditingPath ? '#fff' : '#0f172a',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings dialog */}
      {showSettings && (
        <>
          <div
            onClick={() => setShowSettings(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
            }}
          />
          <div style={{
            position: 'absolute',
            top: '52px',
            right: '12px',
            zIndex: 1002,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: '12px',
          padding: '16px',
          width: '240px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: '16px' }}>
            ⚙️ Settings
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
              MAP THEME
            </div>
            <button
              onClick={() => setIsDark(prev => !prev)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                color: isDark ? '#f1f5f9' : '#0f172a',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              {isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
              VISITED PINS
            </div>
            <button
              onClick={() => setHideVisited(prev => !prev)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                backgroundColor: hideVisited ? '#22c55e' : isDark ? '#1e293b' : '#f8fafc',
                color: hideVisited ? '#fff' : isDark ? '#f1f5f9' : '#0f172a',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              {hideVisited ? '👁️ Show Visited Pins' : '🚫 Hide Visited Pins'}
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
              PATH COLOR
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PATH_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setPathColor(c.value)}
                  title={c.label}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: c.value,
                    border: pathColor === c.value ? '3px solid #3b82f6' : `2px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
              SERENDIPITY
            </div>
            <button
              onClick={() => {
                onResetSerendipity()
                setShowSettings(false)
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                color: isDark ? '#f1f5f9' : '#0f172a',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              🎲 Reset Today's Serendipity
            </button>
          </div>
        </div>
        </>
      )}
    </>
  )
}
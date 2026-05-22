import { useState } from 'react'
import { usePaths } from '../hooks/usePaths'
import { PathCard } from '../components/ui/PathCard'

export function Paths({ user, activePath, setActivePath, onEditPath }) {
  const { paths, loading, createPath, deletePath, deleteStop } = usePaths(user)
  const [building, setBuilding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  function handleSelect(path) {
    setActivePath(prev => prev?.id === path.id ? null : path)
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    const { path } = await createPath({
      title: newTitle.trim(),
      description: newDescription.trim(),
      stops: []
    })
    setNewTitle('')
    setNewDescription('')
    setBuilding(false)
    if (path) setActivePath(path)
  }

  async function handleDelete(pathId) {
    if (!confirm('Delete this path?')) return
    if (activePath?.id === pathId) setActivePath(null)
    await deletePath(pathId)
  }

  async function handleDeleteStop(stopId) {
    if (!confirm('Remove this stop?')) return
    await deleteStop(stopId)
    // update activePath locally so detail panel reflects immediately
    setActivePath(prev => prev ? {
      ...prev,
      path_stops: prev.path_stops.filter(s => s.id !== stopId)
    } : prev)
  }

  const selectedPath = paths.find(p => p.id === activePath?.id) || null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar — path list */}
      <div style={{
        width: '300px',
        backgroundColor: '#0f172a',
        color: '#fff',
        padding: '16px',
        overflowY: 'auto',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Paths</h2>
          <button
            onClick={() => setBuilding(b => !b)}
            style={{
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {building ? 'Cancel' : '+ New'}
          </button>
        </div>

        {building && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
            <input
              placeholder="Path title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#fff',
                boxSizing: 'border-box'
              }}
            />
            <input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#fff',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleCreate}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Create Path
            </button>
          </div>
        )}

        {loading && <div style={{ opacity: 0.5, fontSize: '13px' }}>Loading paths...</div>}

        {!loading && paths.length === 0 && (
          <div style={{ opacity: 0.5, fontSize: '13px' }}>No paths yet. Create one!</div>
        )}

        {paths.map(path => (
          <PathCard
            key={path.id}
            path={path}
            onSelect={handleSelect}
            isActive={activePath?.id === path.id}
          />
        ))}
      </div>

      {/* Detail panel — shows when a path is selected */}
      {selectedPath ? (
        <div style={{
          width: '300px',
          backgroundColor: '#1e293b',
          color: '#fff',
          padding: '16px',
          overflowY: 'auto',
          flexShrink: 0,
          borderLeft: '1px solid #334155'
        }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{selectedPath.title}</h3>
          {selectedPath.description && (
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8' }}>
              {selectedPath.description}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <button
              disabled
              style={{
                padding: '8px',
                backgroundColor: '#334155',
                color: '#64748b',
                border: 'none',
                borderRadius: '6px',
                cursor: 'not-allowed',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              🚶 Start Path — Coming Soon
            </button>
            <button
              onClick={() => onEditPath(selectedPath)}
              style={{
                padding: '8px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              ✏️ Edit Path
            </button>
            <button
              onClick={() => handleDelete(selectedPath.id)}
              style={{
                padding: '8px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              🗑️ Delete Path
            </button>
          </div>

          {/* Stop list */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stops ({selectedPath.path_stops?.length || 0})
            </h4>
            {selectedPath.path_stops?.length === 0 && (
              <div style={{ fontSize: '12px', color: '#475569' }}>
                No stops yet. Hit Edit Path to start adding pins!
              </div>
            )}
            {[...(selectedPath.path_stops || [])].sort((a, b) => a.stop_order - b.stop_order).map((stop, index) => (
              <div key={stop.id} style={{
                padding: '8px',
                marginBottom: '6px',
                backgroundColor: '#0f172a',
                borderRadius: '6px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold', marginRight: '8px' }}>
                    {index + 1}
                  </span>
                  {stop.name || stop.label || 'Unnamed stop'}
                </span>
                <button
                  onClick={() => handleDeleteStop(stop.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          fontSize: '14px'
        }}>
          Select a path to see details
        </div>
      )}
    </div>
  )
}
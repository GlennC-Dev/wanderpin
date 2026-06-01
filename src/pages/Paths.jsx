import { useState, useEffect } from 'react'
import { usePaths } from '../hooks/usePaths'
import { PathCard } from '../components/ui/PathCard'
import { MapContainer as LeafletMap, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function FlyToStop({ stop }) {
  const map = useMap()
  useEffect(() => {
    if (stop) map.flyTo([stop.lat, stop.lng], 16, { duration: 0.8 })
  }, [stop])
  return null
}

export function Paths({ user, activePath, setActivePath, onEditPath }) {
  const { paths, loading, createPath, deletePath, deleteStop, renamePath, updateStopLabel } = usePaths(user)
  const [building, setBuilding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectedStop, setSelectedStop] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteValue, setNoteValue] = useState('')

  function handleSelect(path) {
    setActivePath(prev => prev?.id === path.id ? null : path)
    setSelectedStop(null)
    setEditingNoteId(null)
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
    setActivePath(prev => prev ? {
      ...prev,
      path_stops: prev.path_stops.filter(s => s.id !== stopId)
    } : prev)
    if (selectedStop?.id === stopId) setSelectedStop(null)
    if (editingNoteId === stopId) setEditingNoteId(null)
  }

  async function handleRename(pathId) {
    if (!renameValue.trim()) return
    await renamePath(pathId, renameValue.trim())
    setActivePath(prev => prev?.id === pathId ? { ...prev, title: renameValue.trim() } : prev)
    setRenamingId(null)
    setRenameValue('')
  }

  async function handleSaveNote(stopId) {
    await updateStopLabel(stopId, noteValue.trim() || null)
    setActivePath(prev => prev ? {
      ...prev,
      path_stops: prev.path_stops.map(s =>
        s.id === stopId ? { ...s, label: noteValue.trim() || null } : s
      )
    } : prev)
    setEditingNoteId(null)
    setNoteValue('')
  }

  const selectedPath = paths.find(p => p.id === activePath?.id) || null

  const sortedStops = selectedPath
    ? [...(selectedPath.path_stops || [])].filter(s => s.lat && s.lng).sort((a, b) => a.stop_order - b.stop_order)
    : []
  const mapCenter = sortedStops.length > 0
    ? [sortedStops[0].lat, sortedStops[0].lng]
    : [25.0330, 121.5654]
  const positions = sortedStops.map(s => [s.lat, s.lng])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar — path list */}
      <div style={{
        width: '300px',
        backgroundColor: '#0f172a',
        color: '#fff',
        padding: '60px 16px 16px 16px',
        overflowY: 'scroll',
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

      {/* Detail panel */}
      {selectedPath ? (
        <div style={{
          width: '300px',
          backgroundColor: '#1e293b',
          color: '#fff',
          padding: '60px 16px 16px 16px',
          overflowY: 'auto',
          flexShrink: 0,
          borderLeft: '1px solid #334155'
        }}>

          {/* Title / rename */}
          {renamingId === selectedPath.id ? (
            <div style={{ marginBottom: '12px' }}>
              <input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  fontSize: '15px',
                  fontWeight: 'bold'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleRename(selectedPath.id)}
                  style={{
                    flex: 1, padding: '6px', backgroundColor: '#22c55e',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setRenamingId(null); setRenameValue('') }}
                  style={{
                    flex: 1, padding: '6px', backgroundColor: '#334155',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '12px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', flex: 1 }}>{selectedPath.title}</h3>
              <button
                onClick={() => { setRenamingId(selectedPath.id); setRenameValue(selectedPath.title) }}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', fontSize: '13px', padding: '2px 6px', borderRadius: '4px'
                }}
              >
                ✏️
              </button>
            </div>
          )}

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
                padding: '8px', backgroundColor: '#334155', color: '#64748b',
                border: 'none', borderRadius: '6px', cursor: 'not-allowed',
                fontSize: '13px', fontWeight: 'bold'
              }}
            >
              🚶 Start Path — Coming Soon
            </button>
            <button
              onClick={() => onEditPath(selectedPath)}
              style={{
                padding: '8px', backgroundColor: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 'bold'
              }}
            >
              ✏️ Edit Path
            </button>
            <button
              onClick={() => handleDelete(selectedPath.id)}
              style={{
                padding: '8px', backgroundColor: '#ef4444', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 'bold'
              }}
            >
              🗑️ Delete Path
            </button>
          </div>

          {/* Stop list */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stops ({sortedStops.length})
            </h4>
            {sortedStops.length === 0 && (
              <div style={{ fontSize: '12px', color: '#475569' }}>
                No stops yet. Hit Edit Path to start adding pins!
              </div>
            )}
            {sortedStops.map((stop, index) => (
              <div
                key={stop.id}
                style={{
                  marginBottom: '6px',
                  backgroundColor: selectedStop?.id === stop.id ? '#1e3a5f' : '#0f172a',
                  borderRadius: '6px',
                  border: selectedStop?.id === stop.id ? '1px solid #3b82f6' : '1px solid transparent',
                  overflow: 'hidden',
                }}
              >
                {/* Stop row */}
                <div
                  onClick={() => {
                    setSelectedStop(stop)
                    setEditingNoteId(null)
                  }}
                  style={{
                    padding: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold', marginRight: '8px' }}>
                      {index + 1}
                    </span>
                    {stop.name || 'Unnamed stop'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStop(stop.id) }}
                    style={{
                      background: 'none', border: 'none', color: '#ef4444',
                      cursor: 'pointer', fontSize: '14px', padding: '2px 6px',
                      borderRadius: '4px', flexShrink: 0
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Note section — shows when stop is selected */}
                {selectedStop?.id === stop.id && (
                  <div style={{ padding: '0 8px 8px 8px' }}>
                    {editingNoteId === stop.id ? (
                      <div>
                        <input
                          autoFocus
                          value={noteValue}
                          onChange={e => setNoteValue(e.target.value)}
                          placeholder="Add a note..."
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                            marginBottom: '6px',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSaveNote(stop.id)}
                            style={{
                              flex: 1, padding: '5px', backgroundColor: '#22c55e',
                              color: '#fff', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingNoteId(null); setNoteValue('') }}
                            style={{
                              flex: 1, padding: '5px', backgroundColor: '#334155',
                              color: '#fff', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', fontSize: '11px'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setEditingNoteId(stop.id); setNoteValue(stop.label || '') }}
                        style={{
                          fontSize: '12px',
                          color: stop.label ? '#94a3b8' : '#475569',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          border: '1px dashed #334155',
                          fontStyle: stop.label ? 'normal' : 'italic',
                        }}
                      >
                        {stop.label || 'Add a note...'}
                      </div>
                    )}
                  </div>
                )}

                {/* Show note preview when stop is not selected but has a note */}
                {selectedStop?.id !== stop.id && stop.label && (
                  <div style={{
                    padding: '0 8px 6px 28px',
                    fontSize: '11px',
                    color: '#475569',
                    fontStyle: 'italic',
                  }}>
                    {stop.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#475569', fontSize: '14px'
        }}>
          Select a path to see details
        </div>
      )}

      {/* Right panel — path preview map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {selectedPath ? (
          sortedStops.length > 0 ? (
            <LeafletMap
              key={selectedPath.id}
              center={mapCenter}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToStop stop={selectedStop} />
              {positions.length > 1 && (
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8, dashArray: '6, 6' }}
                />
              )}
              {sortedStops.map((stop, index) => (
                <Marker
                  key={stop.id}
                  position={[stop.lat, stop.lng]}
                  icon={L.divIcon({
                    html: `<div style="
                      background: ${selectedStop?.id === stop.id ? '#ef4444' : '#3b82f6'};
                      color: white;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 11px;
                      font-weight: bold;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">${index + 1}</div>`,
                    className: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })}
                >
                  <Popup>
                    <strong>Stop {index + 1}</strong><br />
                    {stop.name || stop.label || 'Unnamed stop'}
                  </Popup>
                </Marker>
              ))}
            </LeafletMap>
          ) : (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#475569', fontSize: '14px',
              flexDirection: 'column', gap: '8px'
            }}>
              <div style={{ fontSize: '32px' }}>📍</div>
              <div>No stops yet — hit Edit Path to start building!</div>
            </div>
          )
        ) : (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#475569', fontSize: '14px',
            flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ fontSize: '32px' }}>🗺️</div>
            <div>Select a path to preview it here</div>
          </div>
        )}
      </div>
    </div>
  )
}
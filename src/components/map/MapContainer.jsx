import { useState, useEffect, useRef } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORIES } from '../../constants/categories'
import CategoryLayer from './CategoryLayer'
import CategoryToggle from '../ui/CategoryToggle'
import PathLayer from './PathLayer'
import SearchBar from '../ui/SearchBar'
import { usePinState } from '../../hooks/usePinState'
import { useHomeBase } from '../../hooks/useHomeBase'
import { usePaths } from '../../hooks/usePaths'
import { useCustomPins } from '../../hooks/useCustomPins'

const MIN_ZOOM_FOR_PINS = 13

const TILE_DARK = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
}

const TILE_LIGHT = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 15)
  }, [lat, lng])
  return null
}

function BoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => updateBounds(),
    zoomend: () => updateBounds(),
  })
  const debounceRef = useRef(null)

  function updateBounds() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const zoom = map.getZoom()
      if (zoom < MIN_ZOOM_FOR_PINS) {
        onBoundsChange(null)
        return
      }
      const b = map.getBounds()
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    }, 800)
  }

  return null
}

function DropPinHandler({ isDropMode, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (isDropMode) onMapClick(e.latlng)
    }
  })
  return null
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createCustomPinIcon(color) {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">📌</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function MapContainer({ session, isEditingPath, activePath, setActivePath, isDark, hideVisited, pathColor, isDropMode, setIsDropMode }) {
  const [activeCategories, setActiveCategories] = useState([])
  const [previewPath, setPreviewPath] = useState(null)
  const [bounds, setBounds] = useState(null)
  const userId = session?.user?.id
  const { pinStates, setPinState } = usePinState(userId)
  const { homeBase, loading, DEFAULT_HOME_BASE } = useHomeBase(userId)
  const { paths, createPath, fetchPaths } = usePaths(session?.user)
  const { customPins, addCustomPin, updateCustomPin, deleteCustomPin } = useCustomPins(userId)
  const [showNewPathModal, setShowNewPathModal] = useState(false)
  const [pendingPin, setPendingPin] = useState(null)
  const [newPathTitle, setNewPathTitle] = useState('')

  // Drop pin modal state
  const [dropCoords, setDropCoords] = useState(null)
  const [dropName, setDropName] = useState('')
  const [dropNotes, setDropNotes] = useState('')
  const [showDropModal, setShowDropModal] = useState(false)

  // editing notes on existing custom pins
  const [editingNotesPin, setEditingNotesPin] = useState(null)
  const [editNotesValue, setEditNotesValue] = useState('')

  // Add to path prompt state
  const [pendingCustomPin, setPendingCustomPin] = useState(null)
  const [showAddToPathPrompt, setShowAddToPathPrompt] = useState(false)
  const [addingToPathPin, setAddingToPathPin] = useState(null)

  // Edit custom pin state
  const [editingCustomPin, setEditingCustomPin] = useState(null)
  const [editName, setEditName] = useState('')

  const anchor = homeBase || DEFAULT_HOME_BASE
  const displayedPath = isEditingPath ? activePath : previewPath
  const tile = isDark ? TILE_DARK : TILE_LIGHT

  function handleToggle(id) {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function handlePreviewSelect(e) {
    const selectedId = e.target.value
    if (!selectedId) { setPreviewPath(null); return }
    const found = paths.find(p => p.id === selectedId)
    setPreviewPath(found || null)
  }

  function handleMapClick(latlng) {
    setDropCoords(latlng)
    setDropName('')
    setShowDropModal(true)
  }

  async function handleConfirmDrop() {
    if (!dropName.trim() || !dropCoords) return
      const { pin } = await addCustomPin({
      name: dropName.trim(),
      lat: dropCoords.lat,
      lng: dropCoords.lng,
      notes: dropNotes.trim() || null,
    })
    setShowDropModal(false)
    setDropCoords(null)
    setDropName('')
    setDropNotes('')
    setIsDropMode(false)


    if (pin) {
      setPendingCustomPin(pin)
      setShowAddToPathPrompt(true)
    }
  }

  async function handleAddToPath(path, pin) {
    const { supabase } = await import('../../lib/supabase')
    const nextOrder = (path.path_stops?.length || 0) + 1
    const osmId = pin.customId ? `custom:${pin.customId}` : String(pin.id)
    await supabase.from('path_stops').insert({
      path_id: path.id,
      osm_id: osmId,
      name: pin.name,
      lat: pin.lat,
      lng: pin.lng,
      stop_order: nextOrder,
      label: null
    })
    await fetchPaths()
    setActivePath(prev => prev ? {
      ...prev,
      path_stops: [
        ...(prev.path_stops || []),
        { osm_id: osmId, name: pin.name, lat: pin.lat, lng: pin.lng, stop_order: nextOrder }
      ]
    } : prev)
  }

  async function handleRemoveFromPath(path, pin) {
    const osmId = pin.customId ? `custom:${pin.customId}` : String(pin.id)
    const stop = path.path_stops?.find(s => s.osm_id === osmId)
    if (!stop) return
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('path_stops').delete().eq('id', stop.id)
    await fetchPaths()
    setActivePath(prev => prev ? {
      ...prev,
      path_stops: prev.path_stops.filter(s => s.osm_id !== osmId)
    } : prev)
  }

  function handleCreateAndAddToPath(pin) {
    setPendingPin(pin)
    setShowNewPathModal(true)
  }

  async function handleConfirmNewPath() {
    if (!newPathTitle.trim()) return
    const { path } = await createPath({
      title: newPathTitle.trim(),
      description: '',
      stops: []
    })
    setNewPathTitle('')
    setShowNewPathModal(false)
    if (path && pendingPin) {
      await handleAddToPath({ ...path, path_stops: [] }, pendingPin)
      setActivePath({ ...path, path_stops: [] })
    }
    setPendingPin(null)
  }

  async function handleAddCustomPinToPath(path) {
    if (!pendingCustomPin) return
    await handleAddToPath(path, {
      id: pendingCustomPin.id,
      customId: pendingCustomPin.id,
      name: pendingCustomPin.name,
      lat: pendingCustomPin.lat,
      lng: pendingCustomPin.lng,
    })
    setPendingCustomPin(null)
    setShowAddToPathPrompt(false)
    setAddingToPathPin(null)
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

  const showMyPins = activeCategories.includes('mypins')

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <CategoryToggle
        categories={CATEGORIES}
        active={activeCategories}
        onToggle={handleToggle}
        isDark={isDark}
      />

      {!isEditingPath && paths.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '108px',
          right: '12px',
          zIndex: 1000,
        }}>
          <select
            value={previewPath?.id || ''}
            onChange={handlePreviewSelect}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)',
              color: isDark ? '#fff' : '#0f172a',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <option value=''>No Path Selected</option>
            {paths.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Drop pin name modal */}
      {showDropModal && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          backgroundColor: '#0f172a',
          color: '#fff',
          padding: '24px',
          borderRadius: '12px',
          width: '280px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>📌 Name this Pin</h3>
<input
            placeholder="e.g. That amazing noodle place"
            value={dropName}
            onChange={e => setDropName(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleConfirmDrop()}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#1e293b',
              color: '#fff',
              marginBottom: '8px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
          <textarea
            placeholder="Notes (optional)"
            value={dropNotes}
            onChange={e => setDropNotes(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#1e293b',
              color: '#fff',
              marginBottom: '12px',
              boxSizing: 'border-box',
              fontSize: '13px',
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowDropModal(false); setIsDropMode(false); setDropNotes('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                backgroundColor: '#334155', color: '#fff', cursor: 'pointer', fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDrop}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                backgroundColor: '#f97316', color: '#fff', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px'
              }}
            >
              Drop It
            </button>
          </div>
        </div>
      )}

      {/* Add to path prompt */}
      {showAddToPathPrompt && pendingCustomPin && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          backgroundColor: '#0f172a',
          color: '#fff',
          padding: '24px',
          borderRadius: '12px',
          width: '280px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>📍 Add to a Path?</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8' }}>
            "{pendingCustomPin.name}" has been saved. Want to add it to a path?
          </p>
          {addingToPathPin ? (
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                Pick a path:
              </div>
              {paths.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddCustomPinToPath(p)}
                  style={{
                    width: '100%', padding: '6px', marginBottom: '4px',
                    borderRadius: '6px', border: '1px solid #3b82f6',
                    background: 'transparent', color: '#3b82f6',
                    cursor: 'pointer', fontSize: '13px', textAlign: 'left'
                  }}
                >
                  {p.title}
                </button>
              ))}
              <button
                onClick={() => setAddingToPathPin(null)}
                style={{
                  width: '100%', padding: '6px', borderRadius: '6px',
                  border: 'none', backgroundColor: '#334155',
                  color: '#fff', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Back
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setPendingCustomPin(null); setShowAddToPathPrompt(false) }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#334155', color: '#fff', cursor: 'pointer', fontSize: '13px'
                }}
              >
                No Thanks
              </button>
              <button
                onClick={() => setAddingToPathPin(pendingCustomPin)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '13px'
                }}
              >
                Yes, Add It
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit custom pin name modal */}
      {editingCustomPin && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          backgroundColor: '#0f172a',
          color: '#fff',
          padding: '24px',
          borderRadius: '12px',
          width: '280px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>✏️ Rename Pin</h3>
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            autoFocus
            onKeyDown={async e => {
              if (e.key === 'Enter') {
                await updateCustomPin(editingCustomPin.id, editName.trim())
                setEditingCustomPin(null)
                setEditName('')
              }
            }}
            style={{
              width: '100%', padding: '8px', borderRadius: '6px',
              border: 'none', backgroundColor: '#1e293b', color: '#fff',
              marginBottom: '12px', boxSizing: 'border-box', fontSize: '14px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setEditingCustomPin(null); setEditName('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                backgroundColor: '#334155', color: '#fff', cursor: 'pointer', fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!editName.trim()) return
                await updateCustomPin(editingCustomPin.id, editName.trim())
                setEditingCustomPin(null)
                setEditName('')
              }}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px'
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* New path modal */}
      {showNewPathModal && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          backgroundColor: '#0f172a',
          color: '#fff',
          padding: '24px',
          borderRadius: '12px',
          width: '280px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>New Path</h3>
          <input
            placeholder="Path title"
            value={newPathTitle}
            onChange={e => setNewPathTitle(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '8px', borderRadius: '6px',
              border: 'none', backgroundColor: '#1e293b', color: '#fff',
              marginBottom: '12px', boxSizing: 'border-box', fontSize: '14px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowNewPathModal(false); setPendingPin(null) }}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                backgroundColor: '#334155', color: '#fff', cursor: 'pointer', fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmNewPath}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px'
              }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      <LeafletMap
        center={[anchor.lat, anchor.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          attribution={tile.attribution}
          url={tile.url}
        />
        <RecenterMap lat={anchor.lat} lng={anchor.lng} />
        <BoundsTracker onBoundsChange={setBounds} />
        <SearchBar isDark={isDark} />
        <DropPinHandler isDropMode={isDropMode} onMapClick={handleMapClick} />

        <Marker
          position={[anchor.lat, anchor.lng]}
          icon={L.divIcon({
            html: `<div style="
              background: #1d4ed8;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">🏠</div>`,
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          })}
        >
          <Popup>🏠 {anchor.label}</Popup>
        </Marker>

        {CATEGORIES.filter(c => activeCategories.includes(c.id) && c.id !== 'mypins').map((cat) => (
          <CategoryLayer
            key={cat.id}
            category={cat}
            lat={anchor.lat}
            lng={anchor.lng}
            bounds={bounds}
            pinStates={pinStates}
            onSetPinState={setPinState}
            isEditingPath={isEditingPath}
            activePath={activePath}
            paths={paths}
            onAddToPath={handleAddToPath}
            onCreateAndAddToPath={handleCreateAndAddToPath}
            onRemoveFromPath={handleRemoveFromPath}
            hideVisited={hideVisited}
          />
        ))}

        {/* Custom pins layer */}
        {showMyPins && customPins.map(pin => {
          const pinKey = `custom:${pin.id}`
          const state = pinStates[pinKey] || null
          const isOnActivePath = activePath?.path_stops?.some(s => s.osm_id === pinKey)

          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createCustomPinIcon(pathColor)}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    📌 {pin.name}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      onClick={() => setPinState(pinKey, 'visited')}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '6px',
                        border: '2px solid #22c55e',
                        background: state === 'visited' ? '#22c55e' : 'white',
                        color: state === 'visited' ? 'white' : '#22c55e',
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                      }}
                    >
                      ✅ Visited
                    </button>
                    <button
                      onClick={() => setPinState(pinKey, 'want_to_go')}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '6px',
                        border: '2px solid #ef4444',
                        background: state === 'want_to_go' ? '#ef4444' : 'white',
                        color: state === 'want_to_go' ? 'white' : '#ef4444',
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                      }}
                    >
                      ❤️ Want
                    </button>
                  </div>

                  {isEditingPath && activePath ? (
                    <button
                      onClick={() => isOnActivePath
                        ? handleRemoveFromPath(activePath, { customId: pin.id, name: pin.name, lat: pin.lat, lng: pin.lng })
                        : handleAddToPath(activePath, { customId: pin.id, name: pin.name, lat: pin.lat, lng: pin.lng })
                      }
                      style={{
                        width: '100%', padding: '6px', borderRadius: '6px',
                        border: '2px solid',
                        borderColor: isOnActivePath ? '#ef4444' : '#3b82f6',
                        background: isOnActivePath ? '#ef4444' : '#3b82f6',
                        color: 'white', cursor: 'pointer', fontWeight: 'bold',
                        fontSize: '12px', marginBottom: '6px'
                      }}
                    >
                      {isOnActivePath ? '✕ Remove from Path' : '📍 Add to Path'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPendingCustomPin(pin)
                        setAddingToPathPin(pin)
                        setShowAddToPathPrompt(true)
                      }}
                      style={{
                        width: '100%', padding: '6px', borderRadius: '6px',
                        border: '2px solid #3b82f6', background: 'white',
                        color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold',
                        fontSize: '12px', marginBottom: '6px'
                      }}
                    >
                      📍 Add to Path
                    </button>
                  )}

{/* Notes section */}
                  {editingNotesPin?.id === pin.id ? (
                    <div style={{ marginBottom: '6px' }}>
                      <textarea
                        value={editNotesValue}
                        onChange={e => setEditNotesValue(e.target.value)}
                        autoFocus
                        rows={2}
                        placeholder="Add a note..."
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#f1f5f9',
                          color: '#0f172a',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                          resize: 'none',
                          marginBottom: '4px',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={async () => {
                            await updateCustomPin(pin.id, { notes: editNotesValue.trim() })
                            setEditingNotesPin(null)
                            setEditNotesValue('')
                          }}
                          style={{
                            flex: 1, padding: '4px', borderRadius: '4px', border: 'none',
                            backgroundColor: '#22c55e', color: '#fff',
                            cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingNotesPin(null); setEditNotesValue('') }}
                          style={{
                            flex: 1, padding: '4px', borderRadius: '4px', border: 'none',
                            backgroundColor: '#94a3b8', color: '#fff',
                            cursor: 'pointer', fontSize: '11px'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setEditingNotesPin(pin); setEditNotesValue(pin.notes || '') }}
                      style={{
                        fontSize: '12px',
                        color: pin.notes ? '#475569' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px dashed #cbd5e1',
                        fontStyle: pin.notes ? 'normal' : 'italic',
                        marginBottom: '6px',
                      }}
                    >
                      {pin.notes || 'Add a note...'}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => { setEditingCustomPin(pin); setEditName(pin.name) }}
                      style={{
                        flex: 1, padding: '5px', borderRadius: '6px',
                        border: '1px solid #94a3b8', background: 'white',
                        color: '#475569', cursor: 'pointer', fontSize: '11px'
                      }}
                    >
                      ✏️ Rename
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${pin.name}"?`)) deleteCustomPin(pin.id)
                      }}
                      style={{
                        flex: 1, padding: '5px', borderRadius: '6px',
                        border: '1px solid #ef4444', background: 'white',
                        color: '#ef4444', cursor: 'pointer', fontSize: '11px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {displayedPath && (
          <PathLayer
            path={displayedPath}
            onRemoveStop={isEditingPath ? (stop) => handleRemoveFromPath(activePath, { id: stop.osm_id }) : null}
            pathColor={pathColor}
          />
        )}
      </LeafletMap>
    </div>
  )
}
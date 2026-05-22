import { useState, useEffect } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORIES } from '../../constants/categories'
import CategoryLayer from './CategoryLayer'
import CategoryToggle from '../ui/CategoryToggle'
import PathLayer from './PathLayer'
import { usePinState } from '../../hooks/usePinState'
import { useHomeBase } from '../../hooks/useHomeBase'
import { usePaths } from '../../hooks/usePaths'
import { useMap } from 'react-leaflet'

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 15)
  }, [lat, lng])
  return null
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapContainer({ session, isEditingPath, activePath, setActivePath }) {
  const [activeCategories, setActiveCategories] = useState([])
  const [previewPath, setPreviewPath] = useState(null)
  const userId = session?.user?.id
  const { pinStates, setPinState } = usePinState(userId)
  const { homeBase, loading, DEFAULT_HOME_BASE } = useHomeBase(userId)
  const { paths, createPath, fetchPaths } = usePaths(session?.user)
  const [showNewPathModal, setShowNewPathModal] = useState(false)
  const [pendingPin, setPendingPin] = useState(null)
  const [newPathTitle, setNewPathTitle] = useState('')

  const anchor = homeBase || DEFAULT_HOME_BASE

  // the path to draw on map — edit mode takes priority over preview
  const displayedPath = isEditingPath ? activePath : previewPath

  function handleToggle(id) {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function handlePreviewSelect(e) {
    const selectedId = e.target.value
    if (!selectedId) {
      setPreviewPath(null)
      return
    }
    const found = paths.find(p => p.id === selectedId)
    setPreviewPath(found || null)
  }

  async function handleAddToPath(path, pin) {
    const { supabase } = await import('../../lib/supabase')
    const nextOrder = (path.path_stops?.length || 0) + 1
    await supabase.from('path_stops').insert({
      path_id: path.id,
      osm_id: String(pin.id),
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
        { osm_id: String(pin.id), name: pin.name, lat: pin.lat, lng: pin.lng, stop_order: nextOrder }
      ]
    } : prev)
  }

  async function handleRemoveFromPath(path, pin) {
    const stop = path.path_stops?.find(s => s.osm_id === String(pin.id))
    if (!stop) return
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('path_stops').delete().eq('id', stop.id)
    await fetchPaths()
    setActivePath(prev => prev ? {
      ...prev,
      path_stops: prev.path_stops.filter(s => s.osm_id !== String(pin.id))
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

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <CategoryToggle
        categories={CATEGORIES}
        active={activeCategories}
        onToggle={handleToggle}
      />

      {/* Path preview dropdown — top right, hidden in edit mode */}
      {!isEditingPath && paths.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '60px',
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
              backgroundColor: 'rgba(15,23,42,0.9)',
              color: '#fff',
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

      {/* New path modal */}
      {showNewPathModal && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
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
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#1e293b',
              color: '#fff',
              marginBottom: '12px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowNewPathModal(false); setPendingPin(null) }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#334155',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmNewPath}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#22c55e',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={anchor.lat} lng={anchor.lng} />
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

        {CATEGORIES.filter((c) => activeCategories.includes(c.id)).map((cat) => (
          <CategoryLayer
            key={cat.id}
            category={cat}
            lat={anchor.lat}
            lng={anchor.lng}
            pinStates={pinStates}
            onSetPinState={setPinState}
            isEditingPath={isEditingPath}
            activePath={activePath}
            paths={paths}
            onAddToPath={handleAddToPath}
            onCreateAndAddToPath={handleCreateAndAddToPath}
            onRemoveFromPath={handleRemoveFromPath}
          />
        ))}

        {/* Draw path on map — edit mode or preview */}
        {displayedPath && (
          <PathLayer
            path={displayedPath}
            onRemoveStop={isEditingPath ? (stop) => handleRemoveFromPath(activePath, { id: stop.osm_id }) : null}
          />
        )}
      </LeafletMap>
    </div>
  )
}
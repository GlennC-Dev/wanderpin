import { useState, useEffect } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../constants/categories'
import CategoryLayer from './CategoryLayer'
import CategoryToggle from '../ui/CategoryToggle'
import { usePinState } from '../../hooks/usePinState'
import { useHomeBase } from '../../hooks/useHomeBase'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapContainer({ session }) {
  const [activeCategories, setActiveCategories] = useState([])
  const userId = session?.user?.id
  const { pinStates, setPinState } = usePinState(userId)
  const { homeBase, loading, saveHomeBase, DEFAULT_HOME_BASE } = useHomeBase(userId)

  const anchor = homeBase || DEFAULT_HOME_BASE

  function handleToggle(id) {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
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
      <LeafletMap
        center={[anchor.lat, anchor.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
          />
        ))}
      </LeafletMap>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../constants/categories'
import CategoryLayer from './CategoryLayer'
import CategoryToggle from '../ui/CategoryToggle'
import { usePinState } from '../../hooks/usePinState'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const HOME_BASE = {
  lat: 25.0330,
  lng: 121.5654,
  label: 'Taipei Main Station'
}

export default function MapContainer() {
  const [activeCategories, setActiveCategories] = useState([])
  const [userId, setUserId] = useState(null)
  const { pinStates, setPinState } = usePinState(userId)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null)
    })
  }, [])

  function handleToggle(id) {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <CategoryToggle
        categories={CATEGORIES}
        active={activeCategories}
        onToggle={handleToggle}
      />
      <LeafletMap
        center={[HOME_BASE.lat, HOME_BASE.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[HOME_BASE.lat, HOME_BASE.lng]}
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
  <Popup>🏠 Home Base — {HOME_BASE.label}</Popup>
</Marker>
        {CATEGORIES.filter((c) => activeCategories.includes(c.id)).map((cat) => (
          <CategoryLayer
            key={cat.id}
            category={cat}
            lat={HOME_BASE.lat}
            lng={HOME_BASE.lng}
            pinStates={pinStates}
            onSetPinState={setPinState}
          />
        ))}
      </LeafletMap>
    </div>
  )
}
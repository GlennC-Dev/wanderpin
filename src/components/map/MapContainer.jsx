import { useState } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORIES } from '../../constants/categories'
import CategoryLayer from './CategoryLayer'
import CategoryToggle from '../ui/CategoryToggle'

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
        <Marker position={[HOME_BASE.lat, HOME_BASE.lng]}>
          <Popup>🏠 Home Base — {HOME_BASE.label}</Popup>
        </Marker>
        {CATEGORIES.filter((c) => activeCategories.includes(c.id)).map((cat) => (
          <CategoryLayer
            key={cat.id}
            category={cat}
            lat={HOME_BASE.lat}
            lng={HOME_BASE.lng}
          />
        ))}
      </LeafletMap>
    </div>
  )
}
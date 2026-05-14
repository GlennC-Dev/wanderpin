import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
  return (
    <LeafletMap
      center={[HOME_BASE.lat, HOME_BASE.lng]}
      zoom={15}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[HOME_BASE.lat, HOME_BASE.lng]}>
        <Popup>🏠 Home Base — {HOME_BASE.label}</Popup>
      </Marker>
    </LeafletMap>
  )
}
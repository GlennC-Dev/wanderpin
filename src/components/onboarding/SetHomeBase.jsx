import { useState, useEffect } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchPinsByCategory } from '../../lib/overpass'
import { CATEGORIES } from '../../constants/categories'

const HOTEL_CATEGORY = {
  id: 'hotels',
  label: 'Hotels',
  icon: '🏨',
  color: '#B39DDB',
  overpassQuery: 'tourism=hotel',
}

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng, 'My Hotel')
    }
  })
  return null
}

function createHotelIcon() {
  return L.divIcon({
    html: `<div style="
      background: #B39DDB;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">🏨</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function createPickedIcon() {
  return L.divIcon({
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
  })
}

export default function SetHomeBase({ onSave }) {
  const [picked, setPicked] = useState(null)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [hotels, setHotels] = useState([])
  const [loadingHotels, setLoadingHotels] = useState(true)

  const CENTER = { lat: 25.0330, lng: 121.5654 }

  useEffect(() => {
    fetchPinsByCategory(HOTEL_CATEGORY, CENTER.lat, CENTER.lng, 3000)
      .then(setHotels)
      .catch(console.error)
      .finally(() => setLoadingHotels(false))
  }, [])

  function handlePick(lat, lng, name) {
    setPicked({ lat, lng })
    setLabel(name)
  }

  async function handleSave() {
    if (!picked) return
    setSaving(true)
    await onSave(picked.lat, picked.lng, label || 'My Hotel')
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 'bold' }}>
          🏠 Set Your Home Base
        </h2>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          {loadingHotels
            ? 'Loading hotels...'
            : 'Tap a 🏨 hotel pin to set it as your home base, or tap anywhere on the map.'}
        </p>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <LeafletMap
          center={[CENTER.lat, CENTER.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationPicker onPick={handlePick} />

          {hotels.map((hotel) => (
            <Marker
              key={hotel.id}
              position={[hotel.lat, hotel.lng]}
              icon={createHotelIcon()}
            >
              <Popup>
                <div style={{ minWidth: '160px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    🏨 {hotel.name}
                  </div>
                  <button
                    onClick={() => handlePick(hotel.lat, hotel.lng, hotel.name)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#1d4ed8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}
                  >
                    🏠 Set as Home Base
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {picked && (
            <Marker
              position={[picked.lat, picked.lng]}
              icon={createPickedIcon()}
            />
          )}
        </LeafletMap>
      </div>

      {picked && (
        <div style={{
          padding: '16px 20px',
          background: 'white',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Name it (e.g. My Hotel)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Confirm 🏠'}
          </button>
        </div>
      )}
    </div>
  )
}
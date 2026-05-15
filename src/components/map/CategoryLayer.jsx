import { useEffect, useState, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { fetchPinsByCategory } from '../../lib/overpass'

function createCategoryIcon(category) {
  return L.divIcon({
    html: `<div style="
      background: ${category.color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${category.icon}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function CategoryLayer({ category, lat, lng }) {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const cache = useRef(null)

  useEffect(() => {
    if (cache.current) {
      setPins(cache.current)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchPinsByCategory(category, lat, lng, 1000)
      .then((data) => {
        cache.current = data
        setPins(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category.id, lat, lng])

  if (loading) return null

  return (
    <>
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={createCategoryIcon(category)}
        >
          <Popup>
            <div>
              <span>{category.icon}</span>
              <strong style={{ marginLeft: '6px' }}>{pin.name}</strong>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
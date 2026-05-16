import { useEffect, useState, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { fetchPinsByCategory } from '../../lib/overpass'

function createCategoryIcon(category, state) {
  const opacity = state === 'visited' ? 0.4 : 1
  const badge = state === 'visited' ? '✅' : state === 'want_to_go' ? '❤️' : ''
  
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
      opacity: ${opacity};
      position: relative;
    ">
      ${badge ? `<div style="
        position: absolute;
        top: -6px;
        right: -6px;
        font-size: 12px;
      ">${badge}</div>` : ''}
      ${category.icon}
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function CategoryLayer({ category, lat, lng, pinStates, onSetPinState }) {
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

  if (loading) return (
  <div style={{
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
  }}>
    Loading {category.label}...
  </div>
)

  return (
    <>
      {pins.map((pin) => {
        const state = pinStates[pin.id] || null
        return (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createCategoryIcon(category, state)}
          >
            <Popup>
              <div style={{ minWidth: '160px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {category.icon} {pin.name}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onSetPinState(String(pin.id), 'visited')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: '2px solid #22c55e',
                      background: state === 'visited' ? '#22c55e' : 'white',
                      color: state === 'visited' ? 'white' : '#22c55e',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    ✅ Visited
                  </button>
                  <button
                    onClick={() => onSetPinState(String(pin.id), 'want_to_go')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: '2px solid #ef4444',
                      background: state === 'want_to_go' ? '#ef4444' : 'white',
                      color: state === 'want_to_go' ? 'white' : '#ef4444',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    ❤️ Want
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
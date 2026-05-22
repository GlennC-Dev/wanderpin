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

export default function CategoryLayer({ category, lat, lng, pinStates, onSetPinState, isEditingPath, activePath, paths, onAddToPath, onCreateAndAddToPath, onRemoveFromPath }) {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingPin, setAddingPin] = useState(null)
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
        const isOnActivePath = activePath?.path_stops?.some(s => s.osm_id === String(pin.id))

        return (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createCategoryIcon(category, state)}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {category.icon} {pin.name}
                </div>

                {/* Visited / Want buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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

                {/* Add to Path */}
                {isEditingPath && activePath ? (
                  <button
                    onClick={() => isOnActivePath ? onRemoveFromPath(activePath, pin) : onAddToPath(activePath, pin)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      border: '2px solid',
                      borderColor: isOnActivePath ? '#ef4444' : '#3b82f6',
                      background: isOnActivePath ? '#ef4444' : '#3b82f6',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    {isOnActivePath ? '✕ Remove from Path' : '📍 Add to Path'}
                  </button>
                ) : (
                  <>
                    {addingPin === pin.id ? (
                      <div style={{ marginTop: '4px' }}>
                        {paths.length === 0 ? (
                          <button
                            onClick={() => {
                              setAddingPin(null)
                              onCreateAndAddToPath(pin)
                            }}
                            style={{
                              width: '100%',
                              padding: '6px',
                              borderRadius: '6px',
                              border: '2px solid #22c55e',
                              background: '#22c55e',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '12px',
                            }}
                          >
                            + Create New Path
                          </button>
                        ) : (
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                              Add to which path?
                            </div>
                            {paths.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setAddingPin(null)
                                  onAddToPath(p, pin)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '5px',
                                  marginBottom: '4px',
                                  borderRadius: '6px',
                                  border: '1px solid #3b82f6',
                                  background: 'white',
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  textAlign: 'left'
                                }}
                              >
                                {p.title}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                setAddingPin(null)
                                onCreateAndAddToPath(pin)
                              }}
                              style={{
                                width: '100%',
                                padding: '5px',
                                borderRadius: '6px',
                                border: '1px solid #22c55e',
                                background: 'white',
                                color: '#22c55e',
                                cursor: 'pointer',
                                fontSize: '12px',
                                textAlign: 'left'
                              }}
                            >
                              + Create New Path
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingPin(pin.id)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          border: '2px solid #3b82f6',
                          background: 'white',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                        }}
                      >
                        📍 Add to Path
                      </button>
                    )}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
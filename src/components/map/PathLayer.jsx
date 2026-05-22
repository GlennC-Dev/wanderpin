import { Polyline, Marker, Popup } from 'react-leaflet'

export default function PathLayer({ path, onRemoveStop }) {
  if (!path || !path.path_stops || path.path_stops.length === 0) return null

  const sorted = [...path.path_stops].sort((a, b) => a.stop_order - b.stop_order)
  const positions = sorted.map(stop => [stop.lat, stop.lng])

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8, dashArray: '6, 6' }}
      />
      {sorted.map((stop, index) => (
        <Marker key={stop.id} position={[stop.lat, stop.lng]}>
          <Popup>
            <div style={{ minWidth: '160px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                Stop {index + 1}
              </div>
              <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                {stop.name || stop.label || 'Unnamed stop'}
              </div>
              {onRemoveStop && (
                <button
                  onClick={() => onRemoveStop(stop)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    borderRadius: '6px',
                    border: '2px solid #ef4444',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  ✕ Remove from Path
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
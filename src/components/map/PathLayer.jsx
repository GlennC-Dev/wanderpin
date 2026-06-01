import { Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

export default function PathLayer({ path, onRemoveStop, pathColor }) {
  if (!path || !path.path_stops || path.path_stops.length === 0) return null

  const sorted = [...path.path_stops].sort((a, b) => a.stop_order - b.stop_order)
  const positions = sorted.map(stop => [stop.lat, stop.lng])
  const color = pathColor || '#ef4444'

  function createStopIcon(index) {
    return L.divIcon({
      html: `<div style="
        background: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${index + 1}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color, weight: 3, opacity: 0.8, dashArray: '6, 6' }}
      />
      {sorted.map((stop, index) => (
        <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={createStopIcon(index)}>
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
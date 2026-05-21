import { Polyline, Marker, Popup } from 'react-leaflet'

export function PathLayer({ path }) {
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
            <strong>Stop {index + 1}</strong><br />
            {stop.name || stop.label || 'Unnamed stop'}
          </Popup>
        </Marker>
      ))}
    </>
  )
}
import { useState, useRef } from 'react'
import { useMap } from 'react-leaflet'

export default function SearchBar({ isDark }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef(null)
  const map = useMap()

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setResults([]); setIsOpen(false); return }
    debounceRef.current = setTimeout(() => fetchResults(val), 1000)
  }

  async function fetchResults(q) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'WanderPin/1.0 (travel map app)' } }
      )
      const data = await res.json()
      setResults(data)
      setIsOpen(data.length > 0)
    } catch (err) {
      console.error('Nominatim error:', err)
    }
  }

  function handleSelect(result) {
    map.flyTo([parseFloat(result.lat), parseFloat(result.lon)], 15, { duration: 1.2 })
    setQuery(result.display_name.split(',')[0])
    setResults([])
    setIsOpen(false)
  }

  const bg = isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)'
  const color = isDark ? '#f1f5f9' : '#0f172a'
  const borderColor = isDark ? '#334155' : '#cbd5e1'
  const hoverBg = isDark ? '#1e293b' : '#f1f5f9'
  const mutedColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <div style={{
      position: 'absolute',
      top: '80px',
      left: '10px',
      zIndex: 1000,
      width: '260px',
    }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="🔍 Search places..."
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          backgroundColor: bg,
          color: color,
          fontSize: '13px',
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(4px)',
          outline: 'none',
        }}
      />
      {isOpen && results.length > 0 && (
        <div style={{
          marginTop: '4px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          backgroundColor: bg,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          overflow: 'hidden',
        }}>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? `1px solid ${borderColor}` : 'none',
                fontSize: '13px',
                color: color,
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ fontWeight: 'bold' }}>{r.display_name.split(',')[0]}</div>
              <div style={{ fontSize: '11px', color: mutedColor, marginTop: '2px' }}>
                {r.display_name.split(',').slice(1, 3).join(',')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export function PathCard({ path, onSelect, isActive }) {
  const stopCount = path.path_stops?.length || 0

  return (
    <div
      onClick={() => onSelect(path)}
      style={{
        padding: '12px',
        marginBottom: '8px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#3b82f6' : '#1e293b',
        color: isActive ? '#fff' : '#cbd5e1',
        border: isActive ? '2px solid #60a5fa' : '2px solid transparent',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{path.title}</div>
      {path.description && (
        <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
          {path.description}
        </div>
      )}
      <div style={{ fontSize: '11px', opacity: 0.6 }}>
        {stopCount} stop{stopCount !== 1 ? 's' : ''} · {path.is_shared ? 'Shared' : 'Private'}
      </div>
    </div>
  )
}
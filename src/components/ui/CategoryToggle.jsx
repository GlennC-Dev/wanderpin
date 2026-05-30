export default function CategoryToggle({ categories, active, onToggle, isDark }) {
  return (
    <div style={{
      position: 'absolute',
      top: '64px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      padding: '0 16px',
    }}>
      {categories.map((cat) => {
        const isActive = active.includes(cat.id)
        return (
          <button
            key={cat.id}
            onClick={() => onToggle(cat.id)}
            style={{
              background: isActive ? cat.color : isDark ? '#1e293b' : '#ffffff',
              border: `2px solid ${cat.color}`,
              borderRadius: '20px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              color: isActive ? '#ffffff' : isDark ? '#cbd5e1' : '#0f172a',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              opacity: isActive ? 1 : 0.75,
            }}
          >
            {cat.icon} {cat.label}
          </button>
        )
      })}
    </div>
  )
}
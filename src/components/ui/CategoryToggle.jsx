export default function CategoryToggle({ categories, active, onToggle }) {
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
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onToggle(cat.id)}
          style={{
            background: active.includes(cat.id) ? cat.color : '#ffffff',
            border: `2px solid ${cat.color}`,
            borderRadius: '20px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: active.includes(cat.id) ? 1 : 0.6,
          }}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  )
}
export const CATEGORIES = [
  {
    id: 'food',
    label: 'Food & Drink',
    icon: '🍜',
    color: '#FF6B6B',
    overpassQuery: 'amenity~"restaurant|cafe"',
  },
  {
    id: 'landmarks',
    label: 'Landmarks',
    icon: '🏛️',
    color: '#4ECDC4',
    overpassQuery: 'tourism=attraction',
  },
  {
    id: 'convenience',
    label: 'Convenience Stores',
    icon: '🏪',
    color: '#45B7D1',
    overpassQuery: 'shop=convenience',
  },
  {
    id: 'department',
    label: 'Department Stores',
    icon: '🏬',
    color: '#96CEB4',
    overpassQuery: 'shop=department_store',
  },
  {
    id: 'souvenirs',
    label: 'Souvenirs',
    icon: '🎁',
    color: '#FFEAA7',
    overpassQuery: 'shop=gift',
  },
]
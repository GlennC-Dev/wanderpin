const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

async function queryOverpass(query) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: query,
      })
      if (!response.ok) continue
      const data = await response.json()
      return data.elements
    } catch (e) {
      continue
    }
  }
  return []
}

function parseElements(elements, category) {
  return elements.map((el) => ({
    id: el.id,
    lat: el.lat,
    lng: el.lon,
    name: el.tags?.['name:en'] || el.tags?.['name:zh-TW'] || el.tags?.name || 'Unnamed',
    category: category.id,
    tags: el.tags,
  }))
}

// Execution mode — radius from a point (Phase 5/6)
export async function fetchPinsByCategory(category, lat, lng, radiusMeters = 1000) {
  const query = `
    [out:json][timeout:25];
    node[${category.overpassQuery}](around:${radiusMeters},${lat},${lng});
    out body;
  `
  const elements = await queryOverpass(query)
  return parseElements(elements, category)
}

// Planning mode — viewport bounding box
export async function fetchPinsByBounds(category, bounds) {
  const { north, south, east, west } = bounds
  const query = `
    [out:json][timeout:25];
    node[${category.overpassQuery}](${south},${west},${north},${east});
    out body;
  `
  const elements = await queryOverpass(query)
  return parseElements(elements, category)
}

// Serendipity mode — multiple tag filters in one radius query
export async function fetchPinsByRadiusMultiTag(tagQueries, lat, lng, radiusMeters = 200) {
  const filters = tagQueries
    .map((tag) => `node[${tag}](around:${radiusMeters},${lat},${lng});`)
    .join('\n')
  const query = `
    [out:json][timeout:25];
    (
      ${filters}
    );
    out body;
  `
  const elements = await queryOverpass(query)
  return elements
}
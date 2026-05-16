const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

export async function fetchPinsByCategory(category, lat, lng, radiusMeters = 1000) {
  const query = `
    [out:json][timeout:25];
    node[${category.overpassQuery}](around:${radiusMeters},${lat},${lng});
    out body;
  `

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: query,
      })
      if (!response.ok) continue
      const data = await response.json()
      return data.elements.map((el) => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: el.tags?.['name:en'] || el.tags?.['name:zh-TW'] || el.tags?.name || 'Unnamed',
        category: category.id,
        tags: el.tags,
      }))
    } catch (e) {
      continue
    }
  }

  return []
}
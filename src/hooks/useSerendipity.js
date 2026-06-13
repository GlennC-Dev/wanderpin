// src/hooks/useSerendipity.js
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { selectSerendipityPins, getTodayString } from '../lib/serendipity'
import { hasMovedSignificantly } from '../lib/geo'

const MAX_SKIPS_PER_CYCLE = 3

export function useSerendipity({ userLocation, activePath, pinStateRows }) {
  const [activePins, setActivePins] = useState([])
  const [skipsUsed, setSkipsUsed] = useState(0)
  const [todaySkips, setTodaySkips] = useState([])
  const [candidatePool, setCandidatePool] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const lastLocationRef = useRef(null)
  const userId = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userId.current = data?.user?.id ?? null
    })
  }, [])

  const loadTodaySkips = useCallback(async () => {
    if (!userId.current) return
    const today = getTodayString()
    const { data, error } = await supabase
      .from('serendipity_skips')
      .select('*')
      .eq('user_id', userId.current)
      .gte('skipped_at', `${today}T00:00:00`)
      .lte('skipped_at', `${today}T23:59:59`)
    if (!error && data) setTodaySkips(data)
  }, [])

  useEffect(() => {
    loadTodaySkips()
  }, [loadTodaySkips])

  // Infer category from OSM tags — aligned to real CATEGORIES ids
  function inferCategory(tags) {
    if (tags.amenity && ['restaurant', 'cafe', 'bar'].includes(tags.amenity)) return 'food'
    if (tags.tourism === 'attraction') return 'landmarks'
    if (tags.shop === 'convenience') return 'convenience'
    if (tags.shop === 'department_store') return 'department'
    if (tags.shop === 'gift') return 'souvenirs'
    if (tags.tourism === 'hotel') return 'hotels'
    return 'landmarks' // sensible fallback for other tourism tags
  }

  const fetchCandidates = useCallback(async (lat, lng) => {
    setIsLoading(true)
    try {
      const radius = 200
      const query = `
        [out:json][timeout:10];
        (
          node["amenity"~"restaurant|cafe|bar"](around:${radius},${lat},${lng});
          node["tourism"~"attraction|hotel"](around:${radius},${lat},${lng});
          node["shop"~"convenience|department_store|gift"](around:${radius},${lat},${lng});
        );
        out body;
      `
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      })
      const json = await res.json()
      const pins = (json.elements || [])
        .filter((el) => el.tags?.name)
        .map((el) => ({
          osm_id: String(el.id),
          name: el.tags.name,
          lat: el.lat,
          lng: el.lon,
          category: inferCategory(el.tags),
        }))
      setCandidatePool(pins)
    } catch (e) {
      console.error('Serendipity Overpass fetch failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userLocation) return
    const { lat, lng } = userLocation
    const last = lastLocationRef.current

    if (last && hasMovedSignificantly(last.lat, last.lng, lat, lng)) {
      setSkipsUsed(0)
      setActivePins([])
      lastLocationRef.current = { lat, lng }
    } else if (!last) {
      lastLocationRef.current = { lat, lng }
    }

    fetchCandidates(lat, lng)
  }, [userLocation, fetchCandidates])

  // Derive dominant category from active path stops cross-referenced with pinStateRows
  function derivePathCategory(path, rows) {
    if (!path?.path_stops?.length) return null
    const stopIds = new Set(path.path_stops.map((s) => s.osm_id))
    const tally = {}
    for (const row of rows) {
      if (stopIds.has(row.osm_id) && row.category) {
        tally[row.category] = (tally[row.category] || 0) + 1
      }
    }
    return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }

  // Filter to today's visited pins only
  function getTodayPinStates(rows) {
    const today = getTodayString()
    return rows.filter((r) => r.created_at?.startsWith(today) || r.updated_at?.startsWith(today))
  }

  useEffect(() => {
    if (!userLocation || !candidatePool.length) return

    const visitedOsmIds = new Set(
      pinStateRows.filter((p) => p.state === 'visited').map((p) => p.osm_id)
    )

    const filtered = candidatePool.filter((pin) => !visitedOsmIds.has(pin.osm_id))
    const activePathCategory = derivePathCategory(activePath, pinStateRows)
    const activePinCategories = activePins.map((p) => p.category)
    const todayPinStates = getTodayPinStates(pinStateRows)

    const selected = selectSerendipityPins({
      candidatePins: filtered,
      userLat: userLocation.lat,
      userLng: userLocation.lng,
      todayPinStates,
      todaySkips,
      activePathCategory,
      activePinCategories,
    })

    if (selected.length) setActivePins(selected)
  }, [candidatePool, todaySkips, pinStateRows, activePath])

  const skipPin = useCallback(async (pin) => {
    if (skipsUsed >= MAX_SKIPS_PER_CYCLE || !userId.current) return

    await supabase.from('serendipity_skips').insert({
      user_id: userId.current,
      osm_id: pin.osm_id,
      category: pin.category,
    })

    setSkipsUsed((prev) => prev + 1)
    setActivePins((prev) => prev.filter((p) => p.osm_id !== pin.osm_id))
    await loadTodaySkips()
  }, [skipsUsed, loadTodaySkips])

  const resetToday = useCallback(async () => {
    if (!userId.current) return
    const today = getTodayString()
    await supabase
      .from('serendipity_skips')
      .delete()
      .eq('user_id', userId.current)
      .gte('skipped_at', `${today}T00:00:00`)
      .lte('skipped_at', `${today}T23:59:59`)

    setTodaySkips([])
    setSkipsUsed(0)
    setActivePins([])
    lastLocationRef.current = null
  }, [])

  return {
    activePins,
    skipsUsed,
    skipsRemaining: MAX_SKIPS_PER_CYCLE - skipsUsed,
    isLoading,
    skipPin,
    resetToday,
  }
}
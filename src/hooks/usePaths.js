import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePaths(user) {
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchPaths()
  }, [user])

  async function fetchPaths() {
    setLoading(true)
    const { data, error } = await supabase
      .from('paths')
      .select(`
        *,
        path_stops (*)
      `)
      .or(`creator_id.eq.${user.id},is_shared.eq.true`)
      .order('created_at', { ascending: false })

    if (!error) setPaths(data)
    setLoading(false)
  }

  async function createPath({ title, description, stops }) {
    const { data: path, error: pathError } = await supabase
      .from('paths')
      .insert({
        creator_id: user.id,
        title,
        description,
        region: 'taiwan',
        creator_type: 'user',
        is_shared: false
      })
      .select()
      .single()

    if (pathError) return { error: pathError }

    const stopsToInsert = stops.map((stop, index) => ({
      path_id: path.id,
      osm_id: stop.osm_id,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      stop_order: index + 1,
      label: stop.label || null
    }))

    const { error: stopsError } = await supabase
      .from('path_stops')
      .insert(stopsToInsert)

    if (stopsError) return { error: stopsError }

    await fetchPaths()
    return { path }
  }

  async function deletePath(pathId) {
    const { error } = await supabase
      .from('paths')
      .delete()
      .eq('id', pathId)

    if (!error) await fetchPaths()
    return { error }
  }

  return { paths, loading, createPath, deletePath, fetchPaths }
}
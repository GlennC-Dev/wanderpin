import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePinState(userId) {
  const [pinStates, setPinStates] = useState({})
  const [pinStateRows, setPinStateRows] = useState([]) // full rows for category cross-referencing

  useEffect(() => {
    if (!userId) return
    supabase
      .from('pin_states')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach((row) => {
          map[row.osm_id] = row.state
        })
        setPinStates(map)
        setPinStateRows(data)
      })
  }, [userId])

  async function setPinState(osmId, state, meta = {}) {
    const current = pinStates[osmId]
    const newState = current === state ? null : state

    setPinStates((prev) => ({ ...prev, [osmId]: newState }))

    if (newState === null) {
      await supabase
        .from('pin_states')
        .delete()
        .eq('user_id', userId)
        .eq('osm_id', osmId)
      setPinStateRows((prev) => prev.filter((r) => r.osm_id !== osmId))
    } else {
      const row = {
        user_id: userId,
        osm_id: osmId,
        state: newState,
        category: meta.category || null,
        name: meta.name || null,
        lat: meta.lat || null,
        lng: meta.lng || null,
      }
      await supabase.from('pin_states').upsert(row)
      setPinStateRows((prev) => {
        const filtered = prev.filter((r) => r.osm_id !== osmId)
        return [...filtered, row]
      })
    }
  }

  return { pinStates, setPinState, pinStateRows }
}
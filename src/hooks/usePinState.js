import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePinState(userId) {
  const [pinStates, setPinStates] = useState({})

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
      })
  }, [userId])

  async function setPinState(osmId, state) {
    const current = pinStates[osmId]
    const newState = current === state ? null : state

    setPinStates((prev) => ({ ...prev, [osmId]: newState }))

    if (newState === null) {
      await supabase
        .from('pin_states')
        .delete()
        .eq('user_id', userId)
        .eq('osm_id', osmId)
    } else {
      await supabase
        .from('pin_states')
        .upsert({ user_id: userId, osm_id: osmId, state: newState })
    }
  }

  return { pinStates, setPinState }
}
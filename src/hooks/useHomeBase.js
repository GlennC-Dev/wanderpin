import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_HOME_BASE = {
  lat: 25.0330,
  lng: 121.5654,
  label: 'Taipei Main Station'
}

export function useHomeBase(userId) {
  const [homeBase, setHomeBase] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  if (!userId) return
  supabase
    .from('profiles')
    .select('home_base_lat, home_base_lng, home_base_label')
    .eq('id', userId)
    .single()
    .then(({ data, error }) => {
      console.log('homeBase fetch:', data, error)
      if (data?.home_base_lat) {
        setHomeBase({
          lat: data.home_base_lat,
          lng: data.home_base_lng,
          label: data.home_base_label || 'Home Base'
        })
      } else {
        setHomeBase(null)
      }
      setLoading(false)
    })
}, [userId])

async function saveHomeBase(lat, lng, label) {
  setHomeBase({ lat, lng, label })
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, home_base_lat: lat, home_base_lng: lng, home_base_label: label })
  
  if (error) console.error('saveHomeBase error:', error)
  else console.log('saveHomeBase success:', data)
}

async function clearHomeBase() {
  setHomeBase(null)
  await supabase
    .from('profiles')
    .upsert({ id: userId, home_base_lat: null, home_base_lng: null, home_base_label: null })
}

return { homeBase, loading, saveHomeBase, clearHomeBase, DEFAULT_HOME_BASE }
}
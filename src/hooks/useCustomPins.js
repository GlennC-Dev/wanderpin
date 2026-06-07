import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCustomPins(userId) {
  const [customPins, setCustomPins] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetchCustomPins()
  }, [userId])

  async function fetchCustomPins() {
    setLoading(true)
    const { data, error } = await supabase
      .from('custom_pins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) setCustomPins(data)
    setLoading(false)
  }

  async function addCustomPin({ name, lat, lng, notes }) {
    const { data, error } = await supabase
      .from('custom_pins')
      .insert({ user_id: userId, name, lat, lng, notes: notes || null })
      .select()
      .single()

    if (!error) {
      setCustomPins(prev => [data, ...prev])
      return { pin: data }
    }
    return { error }
  }

  async function updateCustomPin(pinId, { name, notes }) {
    const updates = {}
    if (name !== undefined) updates.name = name
    if (notes !== undefined) updates.notes = notes || null

    const { error } = await supabase
      .from('custom_pins')
      .update(updates)
      .eq('id', pinId)

    if (!error) {
      setCustomPins(prev => prev.map(p => p.id === pinId ? { ...p, ...updates } : p))
    }
    return { error }
  }

  async function deleteCustomPin(pinId) {
    const { error } = await supabase
      .from('custom_pins')
      .delete()
      .eq('id', pinId)

    if (!error) {
      setCustomPins(prev => prev.filter(p => p.id !== pinId))
    }
    return { error }
  }

  return { customPins, loading, fetchCustomPins, addCustomPin, updateCustomPin, deleteCustomPin }
}
import { supabase } from './supabase'

export async function loadCollection(userId) {
  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return []
    }

    throw error
  }

  return data.collection_data ?? []
}

export async function saveCollection(
  userId,
  collection
) {
  const { error } = await supabase
    .from('user_collections')
    .upsert(
      {
        user_id: userId,
        collection_data: collection,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )

  if (error) {
    throw error
  }
}
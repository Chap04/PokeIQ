import { supabase } from './supabase'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function saveProfile(
  userId,
  displayName
) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
      },
      {
        onConflict: 'user_id',
      }
    )

  if (error) {
    throw error
  }
}
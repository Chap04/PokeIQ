import { supabase } from './supabase'

export async function saveResources(
  userId,
  resources
) {
  const { error } =
    await supabase
      .from('resources')
      .upsert(
        {
          user_id: userId,
          data: resources,
        },
        {
          onConflict: 'user_id',
        }
      )

  if (error) {
    throw error
  }
}

export async function loadResources(
  userId
) {
  const { data, error } =
    await supabase
      .from('resources')
      .select('data')
      .eq('user_id', userId)
      .single()

  if (error) {
    return null
  }

  return data?.data
}
``
import { supabase } from './supabase'

export async function saveProjects(
  userId,
  projects
) {
  const { error } =
    await supabase
      .from('projects')
      .upsert(
        {
          user_id: userId,
          data: projects,
        },
        {
          onConflict: 'user_id',
        }
      )

  if (error) {
    throw error
  }
}

export async function loadProjects(
  userId
) {
  const { data, error } =
    await supabase
      .from('projects')
      .select('data')
      .eq('user_id', userId)
      .single()

  if (error) {
    return []
  }

  return data?.data ?? []
}
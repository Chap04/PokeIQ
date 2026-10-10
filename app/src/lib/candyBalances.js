import { supabase } from './supabase'

export async function saveCandyBalances(
  userId,
  balances
) {
  const { error } =
    await supabase
      .from('candy_balances')
      .upsert(
        {
          user_id: userId,
          data: balances,
        },
        {
          onConflict: 'user_id',
        }
      )

  if (error) {
    throw error
  }
}

export async function loadCandyBalances(
  userId
) {
  const { data, error } =
    await supabase
      .from('candy_balances')
      .select('data')
      .eq('user_id', userId)
      .single()

  if (error) {
    return null
  }

  return data?.data
}
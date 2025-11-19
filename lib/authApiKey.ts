// lib/authApiKey.ts
import { supabaseAdmin } from './supabaseAdmin'

export type ApiKeyContext = {
  keyId: string
  userId: string
  keyName: string | null
}

/**
 * Haalt de API key uit de headers en valideert 'm tegen de api_keys tabel.
 * - zoekt op kolom `key`
 * - checkt of `revoked_at` null is
 * - zet `last_used_at`
 */
export async function authenticateApiKey(
  request: Request
): Promise<ApiKeyContext | null> {
  // 1. Key uit headers halen
  const authHeader = request.headers.get('authorization')
  const headerKey = request.headers.get('x-api-key')

  let apiKey: string | null = null

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    apiKey = authHeader.slice(7).trim()
  } else if (headerKey) {
    apiKey = headerKey.trim()
  }

  if (!apiKey) {
    return null
  }

  // 2. Key valideren in Supabase
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id, name, revoked_at')
    .eq('key', apiKey)
    .maybeSingle()

  if (error) {
    console.error('Error fetching api key', error)
    return null
  }

  if (!data) {
    // geen key gevonden
    return null
  }

  if (data.revoked_at) {
    // key is ingetrokken
    return null
  }

  // 3. last_used_at bijwerken (fire-and-forget, errors loggen)
  supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(({ error }) => {
      if (error) console.error('Error updating last_used_at', error)
    })

  return {
    keyId: data.id,
    userId: data.user_id,
    keyName: data.name,
  }
}
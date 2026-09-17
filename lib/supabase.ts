import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables')

export const supabase = createClient(
    supabaseUrl,
    supabaseKey,
);

export function createClerkSupabaseClient(getToken: () => Promise<string>) {
    return createClient(
        supabaseUrl!,
        supabaseKey!, {
        async accessToken() {
            return getToken()
        }
    })
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Support both possible env var names
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_ANON_KEY ?? ''

if (!supabaseKey) {
  console.warn('Warning: Supabase anon key not found in env (expected NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_ANON_KEY)')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

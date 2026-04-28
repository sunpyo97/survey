import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rgandvfdpsbfvubbnxsg.supabase.co'
const supabaseKey = 'sb_publishable_Y6wqyge7NX9nHA3gtr2KQQ_XxadmB1z'

export const supabase = createClient(supabaseUrl, supabaseKey)

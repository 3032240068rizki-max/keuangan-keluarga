import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cfaqwgfajzujvrtjltzp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmYXF3Z2Zhanp1anZydGpsdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzQzODYsImV4cCI6MjA5NjY1MDM4Nn0.WA5_ycjpnBDA2DTWnhkbADCY0ZnrNEVLpSITRQe5D0o'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
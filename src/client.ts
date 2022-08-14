import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ebrefpiafigacomcfwxm.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmVmcGlhZmlnYWNvbWNmd3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjA0NjQzNDgsImV4cCI6MTk3NjA0MDM0OH0.RDww3Uf6WI1NnFewFcz0XmWU-oaJlCe6RNe-fYP-dcs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
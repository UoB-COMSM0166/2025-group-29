// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// set Supabase project URL
const SUPABASE_URL = 'https://zogcqsdolkkjwnimnbaw.supabase.co';
// set anonymous public key
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ2Nxc2RvbGtranduaW1uYmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTkwMDAsImV4cCI6MjA2MTc3NTAwMH0.OrDcGnhJWUrKGs6oDfJ0Kb9cmxBDggYtmVleAAlnGTo';

// create Supabase client using URL and anon key
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
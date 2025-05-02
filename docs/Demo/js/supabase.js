// js/supabase.js
// 从 CDN 加载 Supabase ESM 版
import { createClient }
  from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://zogcqsdolkkjwnimnbaw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ2Nxc2RvbGtranduaW1uYmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTkwMDAsImV4cCI6MjA2MTc3NTAwMH0.OrDcGnhJWUrKGs6oDfJ0Kb9cmxBDggYtmVleAAlnGTo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
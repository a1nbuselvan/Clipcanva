import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.CLIPCANVA_SUPABASE_CONFIG;

if (!config?.url || !config?.publishableKey) {
  throw new Error(
    "Supabase configuration is missing. Check supabase-config.js.",
  );
}

export const supabase = createClient(config.url, config.publishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

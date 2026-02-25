import { createClient } from "@supabase/supabase-js";

const isDev = import.meta.env.DEV;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  isDev
    ? {
        auth: {
          lock: (_name, _acquireTimeout, fn) => fn(),
        },
      }
    : {},
);

export default supabase;

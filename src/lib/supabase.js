import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // lock override 제거 — navigator.locks 기본 동작 사용
      // StrictMode 이슈는 useAuthStore에서 처리
    },
  },
);

export default supabase;

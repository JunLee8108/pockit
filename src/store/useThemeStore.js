import { create } from "zustand";
import supabase from "../lib/supabase";

const applyTheme = (resolved) => {
  document.documentElement.setAttribute("data-theme", resolved);
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolve = (theme) => (theme === "system" ? getSystemTheme() : theme);

const useThemeStore = create((set, get) => ({
  theme: "system",
  resolved: getSystemTheme(),

  setTheme: async (value) => {
    const resolved = resolve(value);
    set({ theme: value, resolved });
    applyTheme(resolved);
    localStorage.setItem("pockit-theme", value);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ theme: value })
        .eq("id", user.id);
    }
  },

  // 로그인 시 해당 유저의 테마를 DB에서 로드하여 즉시 적용
  loadUserTheme: async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", userId)
      .single();
    if (data?.theme) {
      const resolved = resolve(data.theme);
      set({ theme: data.theme, resolved });
      applyTheme(resolved);
      localStorage.setItem("pockit-theme", data.theme);
    }
  },

  initialize: async () => {
    // 1. Supabase에서 로드
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await get().loadUserTheme(user.id);
    }

    // 2. 시스템 테마 변경 감지
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const { theme } = get();
      if (theme === "system") {
        const resolved = getSystemTheme();
        set({ resolved });
        applyTheme(resolved);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  },
}));

export default useThemeStore;

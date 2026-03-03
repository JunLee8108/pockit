import { create } from "zustand";
import supabase from "../lib/supabase";

const applyTheme = (resolved) => {
  document.documentElement.setAttribute("data-theme", resolved);
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolve = (theme) => (theme === "system" ? getSystemTheme() : theme);

// ★ localStorage에서 즉시 테마 적용 (네트워크 대기 없음)
const savedTheme = localStorage.getItem("pockit-theme") || "system";
applyTheme(resolve(savedTheme));

const useThemeStore = create((set, get) => ({
  theme: savedTheme,
  resolved: resolve(savedTheme),

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

  // DB에서 테마 로드 (로그인 시 1회만 호출)
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

  // ★ 간소화: getUser() 제거, 시스템 테마 리스너만 등록
  initialize: () => {
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

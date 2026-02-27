import { create } from "zustand";
import supabase from "../lib/supabase";

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      // 1) 현재 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user });
        // fetchProfile을 non-blocking으로 처리
        get()
          .fetchProfile(session.user.id)
          .catch(() => {});
      }

      // 2) auth 상태 변화 리스너
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        // ★ async 제거 — 리스너 안에서 Supabase 요청 안 함
        if (session?.user) {
          set({ user: session.user });
          // profile은 별도 non-blocking fetch
          get()
            .fetchProfile(session.user.id)
            .catch(() => {});
        } else {
          set({ user: null, profile: null });
        }
      });

      set({ loading: false });
      return () => subscription.unsubscribe();
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: error.message });
      return { error };
    }
    if (data.user && displayName) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", data.user.id);
    }
    return { data };
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ error: error.message });
      return { error };
    }
    return { data };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, error: null });
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) {
      set({ profile: data });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (!error && data) {
      set({ profile: data });
    }
    return { data, error };
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;

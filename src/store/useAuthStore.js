import { create } from "zustand";
import supabase from "../lib/supabase";

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  // 앱 마운트 시 세션 확인 + 리스너 등록
  initialize: async () => {
    try {
      // 1) 현재 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      }

      // 2) auth 상태 변화 리스너
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          set({ user: session.user });
          await get().fetchProfile(session.user.id);
        } else {
          set({ user: null, profile: null });
        }
      });

      set({ loading: false });

      // cleanup 함수 반환
      return () => subscription.unsubscribe();
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  // 회원가입
  signUp: async (email, password, displayName) => {
    set({ error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      set({ error: error.message });
      return { error };
    }

    // 트리거로 profile 자동 생성 후, display_name 업데이트
    if (data.user && displayName) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", data.user.id);
    }

    return { data };
  },

  // 로그인
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

  // 로그아웃
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, error: null });
  },

  // 프로필 조회
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

  // 프로필 수정
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

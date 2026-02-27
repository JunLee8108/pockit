import supabase from "./supabase";

export const fromSupabase = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/**
 * 로컬 세션에서 user를 가져옴 (네트워크 요청 없음)
 * getUser() 대신 사용 — 토큰 hang 방지
 */
export const getAuthUser = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user;
};

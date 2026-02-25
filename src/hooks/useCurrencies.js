import { useQuery } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";

export const useCurrencies = () => {
  return useQuery({
    queryKey: queryKeys.currencies,
    queryFn: () =>
      fromSupabase(supabase.from("currencies").select("*").order("code")),
    staleTime: 24 * 60 * 60 * 1000, // 24시간 — 거의 안 변함
  });
};

export const useCurrencyByCode = (code) => {
  const { data: currencies } = useCurrencies();
  return currencies?.find((c) => c.code === code) ?? null;
};

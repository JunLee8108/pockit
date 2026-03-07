import { useQueries } from "@tanstack/react-query";
import supabase from "../lib/supabase";

const useAnnualSummary = (year) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const results = useQueries({
    queries: months.map((month) => {
      const mm = String(month).padStart(2, "0");
      const start = `${year}-${mm}-01`;
      const last = new Date(year, month, 0).getDate();
      const end = `${year}-${mm}-${String(last).padStart(2, "0")}`;
      return {
        queryKey: ["annual-summary", year, month],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("transactions")
            .select("type, amount")
            .gte("date", start)
            .lte("date", end);
          if (error) throw error;
          return data;
        },
        staleTime: 5 * 60 * 1000,
      };
    }),
  });

  const isLoading = results.some((r) => r.isLoading);

  const summary = months.map((month, i) => {
    const txs = results[i].data || [];
    let income = 0,
      expense = 0;
    for (const tx of txs) {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    }
    return { month, label: `${month}월`, income, expense };
  });

  return { summary, isLoading };
};

export default useAnnualSummary;

import { useQueries } from "@tanstack/react-query";
import supabase from "../lib/supabase";

const useMonthlySummary = (count = 6) => {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const results = useQueries({
    queries: months.map(({ year, month }) => {
      const mm = String(month).padStart(2, "0");
      const start = `${year}-${mm}-01`;
      const last = new Date(year, month, 0).getDate();
      const end = `${year}-${mm}-${String(last).padStart(2, "0")}`;
      return {
        queryKey: ["monthly-summary", year, month],
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

  const summary = months.map(({ month }, i) => {
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

export default useMonthlySummary;

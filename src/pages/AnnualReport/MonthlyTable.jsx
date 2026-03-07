import { memo, useMemo } from "react";

const MonthlyTable = memo(({ summary, fmt }) => {
  const { totalIncome, totalExpense, bestMonth, worstMonth } = useMemo(() => {
    let totInc = 0,
      totExp = 0;
    let best = { month: 0, net: -Infinity };
    let worst = { month: 0, net: Infinity };

    summary.forEach((s) => {
      totInc += s.income;
      totExp += s.expense;
      const net = s.income - s.expense;
      if (net > best.net) best = { month: s.month, net };
      if (net < worst.net) worst = { month: s.month, net };
    });

    return {
      totalIncome: totInc,
      totalExpense: totExp,
      bestMonth: best.month,
      worstMonth: worst.month,
    };
  }, [summary]);

  const hasData = summary.some((s) => s.income > 0 || s.expense > 0);

  if (!hasData) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-4">월별 상세</h3>
        <p className="text-[13px] text-sub">거래 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-[13px] text-sub font-medium mb-4">월별 상세</h3>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-[13px] min-w-[400px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-sub font-medium py-2 pr-2">월</th>
              <th className="text-right text-sub font-medium py-2 px-2">수입</th>
              <th className="text-right text-sub font-medium py-2 px-2">지출</th>
              <th className="text-right text-sub font-medium py-2 pl-2">순수지</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => {
              const net = s.income - s.expense;
              const isBest = s.month === bestMonth;
              const isWorst = s.month === worstMonth;
              return (
                <tr
                  key={s.month}
                  className={`border-b border-border last:border-b-0 ${
                    isBest
                      ? "bg-mint/5"
                      : isWorst
                        ? "bg-coral/5"
                        : ""
                  }`}
                >
                  <td className="py-2.5 pr-2 text-text font-medium">
                    {s.label}
                    {isBest && (
                      <span className="ml-1.5 text-[11px] text-mint">최고</span>
                    )}
                    {isWorst && (
                      <span className="ml-1.5 text-[11px] text-coral">최저</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-mint">
                    {fmt(s.income)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-coral">
                    {fmt(s.expense)}
                  </td>
                  <td
                    className={`py-2.5 pl-2 text-right font-semibold ${
                      net >= 0 ? "text-mint" : "text-coral"
                    }`}
                  >
                    {net >= 0 ? "+" : "-"}
                    {fmt(Math.abs(net))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td className="py-2.5 pr-2 text-text">합계</td>
              <td className="py-2.5 px-2 text-right text-mint">
                {fmt(totalIncome)}
              </td>
              <td className="py-2.5 px-2 text-right text-coral">
                {fmt(totalExpense)}
              </td>
              <td
                className={`py-2.5 pl-2 text-right ${
                  totalIncome - totalExpense >= 0 ? "text-mint" : "text-coral"
                }`}
              >
                {totalIncome - totalExpense >= 0 ? "+" : "-"}
                {fmt(Math.abs(totalIncome - totalExpense))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

MonthlyTable.displayName = "MonthlyTable";

export default MonthlyTable;

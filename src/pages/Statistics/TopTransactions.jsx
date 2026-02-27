import { useMemo } from "react";
import { formatMoney } from "../../utils/format";
import CategoryIcon from "../../components/CategoryIcon";

const TopTransactions = ({ transactions, currency }) => {
  const top5 = useMemo(() => {
    return [...transactions]
      .filter((tx) => tx.type === "expense")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  if (top5.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-3">
          상위 지출 Top 5
        </h3>
        <p className="text-[13px] text-sub">지출 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-[13px] text-sub font-medium mb-3">상위 지출 Top 5</h3>
      <div className="flex flex-col">
        {top5.map((tx, i) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
          >
            <span className="text-[13px] text-sub font-medium w-5 text-center shrink-0">
              {i + 1}
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: tx.category?.color
                  ? tx.category.color + "18"
                  : "var(--color-light)",
              }}
            >
              <CategoryIcon
                name={tx.category?.icon}
                size={16}
                style={{ color: tx.category?.color || "#94a3b8" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-text truncate">
                {tx.description || tx.category?.name || "거래"}
              </div>
              <div className="text-[12px] text-sub">
                {tx.date} · {tx.account?.name}
              </div>
            </div>
            <span className="text-[14px] font-semibold text-coral shrink-0">
              {formatMoney(tx.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopTransactions;

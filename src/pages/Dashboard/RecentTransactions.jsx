import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRightLeft } from "lucide-react";
import { formatMoney } from "../../utils/format";
import { useCurrencyByCode } from "../../hooks/useCurrencies";
import CategoryIcon from "../../components/CategoryIcon";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const formatDateHeader = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = DAYS[d.getDay()];
  return `${month}월 ${date}일 (${day})`;
};

const TYPE_STYLES = {
  income: { sign: "+", color: "text-mint" },
  expense: { sign: "-", color: "text-coral" },
  transfer: { sign: "", color: "text-sub" },
};

const CategoryDistribution = ({ transactions }) => {
  const categories = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const key = tx.category_id || "uncategorized";
        if (!map[key]) {
          map[key] = {
            name: tx.category?.name || "미분류",
            icon: tx.category?.icon || "Package",
            color: tx.category?.color || "#94a3b8",
            amount: 0,
          };
        }
        map[key].amount += tx.amount;
      });

    const sorted = Object.values(map).sort((a, b) => b.amount - a.amount);
    const total = sorted.reduce((s, c) => s + c.amount, 0);
    return {
      items: sorted.map((c) => ({
        ...c,
        pct: total > 0 ? (c.amount / total) * 100 : 0,
      })),
      total,
    };
  }, [transactions]);

  if (categories.items.length === 0) return null;

  const top3 = categories.items.slice(0, 3);

  return (
    <div className="mb-5">
      <div className="h-2.5 bg-light rounded-full overflow-hidden flex">
        {categories.items.map((cat, i) => {
          const isFirst = i === 0;
          const isLast = i === categories.items.length - 1;
          const radius = isFirst && isLast
            ? "rounded-full"
            : isFirst
              ? "rounded-l-full"
              : isLast
                ? "rounded-r-full"
                : "";
          return (
            <div
              key={cat.name + i}
              className={`h-full ${radius}`}
              style={{
                width: `${cat.pct}%`,
                backgroundColor: cat.color,
                minWidth: cat.pct > 0 ? 2 : 0,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        {top3.map((cat) => (
          <span
            key={cat.name}
            className="flex items-center gap-1 text-[11px] text-sub"
          >
            <CategoryIcon
              name={cat.icon}
              size={10}
              style={{ color: cat.color }}
            />
            {cat.name} {Math.round(cat.pct)}%
          </span>
        ))}
      </div>
    </div>
  );
};

const TxRow = ({ tx, isLast }) => {
  const currency = useCurrencyByCode(tx.currency);
  const style = TYPE_STYLES[tx.type];

  return (
    <div
      className={`flex items-center gap-3 py-3 ${isLast ? "" : "border-b border-border"}`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: tx.category?.color
            ? tx.category.color + "18"
            : "var(--color-light)",
        }}
      >
        {tx.type === "transfer" ? (
          <ArrowRightLeft size={14} className="text-sub" />
        ) : (
          <CategoryIcon
            name={tx.category?.icon}
            size={14}
            style={{ color: tx.category?.color || "#94a3b8" }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-text truncate">
          {tx.description ||
            tx.category?.name ||
            (tx.type === "transfer" ? "이체" : "거래")}
        </div>
        <div className="text-[11px] text-sub truncate">
          {tx.account?.name}
          {tx.type === "transfer" &&
            tx.to_account &&
            ` → ${tx.to_account.name}`}
          {tx.category && tx.type !== "transfer" && ` · ${tx.category.name}`}
        </div>
      </div>

      <div className={`text-[13px] font-semibold shrink-0 ${style.color}`}>
        {style.sign}
        {formatMoney(tx.amount, currency)}
      </div>
    </div>
  );
};

const RecentTransactions = ({ transactions }) => {
  const grouped = useMemo(() => {
    const recent = transactions.slice(0, 7);
    const map = new Map();
    recent.forEach((tx) => {
      const key = tx.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tx);
    });
    return [...map.entries()];
  }, [transactions]);

  if (grouped.length === 0) {
    return (
      <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
        <h3 className="text-[13px] text-sub font-medium tracking-wide mb-3">
          최근 거래
        </h3>
        <p className="text-[13px] text-sub">이번달 거래가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] text-sub font-medium tracking-wide">
          최근 거래
        </h3>
        <Link
          to="/transactions"
          className="text-mint text-[12px] font-medium no-underline"
        >
          전체 보기 →
        </Link>
      </div>

      {/* Category Distribution Bar */}
      <CategoryDistribution transactions={transactions} />

      {grouped.map(([date, txs], gi) => (
        <div key={date} className={gi > 0 ? "mt-4" : ""}>
          <div className="text-[11px] text-sub font-medium mb-1 tracking-wide">
            {formatDateHeader(date)}
          </div>
          {txs.map((tx, ti) => (
            <TxRow key={tx.id} tx={tx} isLast={ti === txs.length - 1} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default RecentTransactions;

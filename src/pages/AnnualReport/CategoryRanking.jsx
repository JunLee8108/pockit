import { memo, useMemo, useState } from "react";
import CategoryIcon from "../../components/CategoryIcon";

const CategoryRanking = memo(({ transactions, categories, fmt }) => {
  const [tab, setTab] = useState("expense");

  const ranked = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => tx.type === tab)
      .forEach((tx) => {
        const key = tx.category_id || "uncategorized";
        if (!map[key]) map[key] = { id: key, total: 0 };
        map[key].total += tx.amount;
      });

    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    const grandTotal = sorted.reduce((s, c) => s + c.total, 0);

    return sorted.slice(0, 10).map((item) => {
      const cat = categories.find((c) => c.id === item.id);
      return {
        ...item,
        name: cat?.name || "미분류",
        icon: cat?.icon || "Package",
        color: cat?.color || "#94a3b8",
        pct: grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0,
        ratio: grandTotal > 0 ? item.total / grandTotal : 0,
      };
    });
  }, [transactions, categories, tab]);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] text-sub font-medium">카테고리별 순위</h3>
        <div className="flex gap-1">
          {[
            { key: "expense", label: "지출" },
            { key: "income", label: "수입" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-2.5 py-1 text-[12px] rounded-md border-none cursor-pointer transition-colors ${
                tab === t.key
                  ? "bg-mint text-white font-semibold"
                  : "bg-light text-sub"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <p className="text-[13px] text-sub">데이터가 없습니다</p>
      ) : (
        <div className="flex flex-col gap-3">
          {ranked.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-[12px] text-sub w-5 text-right shrink-0">
                {i + 1}
              </span>
              <CategoryIcon
                name={cat.icon}
                size={16}
                style={{ color: cat.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-text truncate">
                    {cat.name}
                  </span>
                  <span className="text-[13px] font-semibold text-text shrink-0 ml-2">
                    {fmt(cat.total)}
                  </span>
                </div>
                <div className="h-1.5 bg-light rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${cat.ratio * 100}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
              <span className="text-[12px] text-sub w-10 text-right shrink-0">
                {cat.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

CategoryRanking.displayName = "CategoryRanking";

export default CategoryRanking;

import { useState, useMemo, memo } from "react";
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import { ChevronRight } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";
import CategoryTransactionModal from "./CategoryTransactionModal";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-3 text-[12px]">
      <div className="font-medium text-text">{d.name}</div>
      <div className="text-sub">{d.pct}%</div>
    </div>
  );
};

const CategoryBreakdown = memo(({ transactions, fmt, year, month }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { chartData, total, categoryMap } = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const key = tx.category_id || "uncategorized";
        if (!map[key]) {
          map[key] = {
            id: key,
            name: tx.category?.name || "미분류",
            icon: tx.category?.icon || "Package",
            color: tx.category?.color || "#94a3b8",
            value: 0,
            count: 0,
          };
        }
        map[key].value += tx.amount;
        map[key].count += 1;
      });

    const sorted = Object.values(map).sort((a, b) => b.value - a.value);
    const tot = sorted.reduce((s, c) => s + c.value, 0);
    const withPct = sorted.map((c) => ({
      ...c,
      pct: tot > 0 ? Math.round((c.value / tot) * 100) : 0,
    }));

    return { chartData: withPct, total: tot, categoryMap: map };
  }, [transactions]);

  // 클릭한 카테고리의 거래 목록
  const categoryTxs = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions
      .filter((tx) => {
        const key = tx.category_id || "uncategorized";
        return tx.type === "expense" && key === selectedCategory.id;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedCategory]);

  if (chartData.length === 0) {
    return (
      <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
        <h3 className="text-[13px] text-sub font-medium mb-3">
          카테고리별 지출
        </h3>
        <p className="text-[13px] text-sub">지출 내역이 없습니다</p>
      </div>
    );
  }

  // 도넛 차트용: Top 5 + 기타
  const pieData = useMemo(() => {
    const top5 = chartData.slice(0, 5);
    if (chartData.length > 5) {
      const rest = chartData.slice(5).reduce((s, c) => s + c.value, 0);
      const restPct =
        total > 0 ? Math.round((rest / total) * 100) : 0;
      top5.push({
        id: "__rest",
        name: "기타",
        icon: "Package",
        color: "#cbd5e1",
        value: rest,
        pct: restPct,
        count: 0,
      });
    }
    return top5;
  }, [chartData, total]);

  return (
    <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
      <h3 className="text-[13px] text-sub font-medium mb-3">카테고리별 지출</h3>

      {/* Donut Chart */}
      <div className="w-full flex justify-center" style={{ height: 200 }}>
        <PieChart width={200} height={200}>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <Label
              position="center"
              content={(props) => {
                const cx = props?.viewBox?.cx ?? 100;
                const cy = props?.viewBox?.cy ?? 100;
                return (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    <tspan x={cx} dy="-8" fill="var(--color-sub)" fontSize="11">
                      총 지출
                    </tspan>
                    <tspan
                      x={cx}
                      dy="20"
                      fill="var(--color-text)"
                      fontSize="16"
                      fontWeight="700"
                    >
                      {fmt(total)}
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </div>

      {/* Full Category List */}
      <div className="flex flex-col mt-3">
        {chartData.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0 bg-transparent border-x-0 border-t-0 cursor-pointer text-left w-full hover:bg-light transition-colors rounded-lg px-1 -mx-1"
          >
            <span className="flex items-center gap-2 text-[13px] text-text truncate">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: cat.color + "18" }}
              >
                <CategoryIcon
                  name={cat.icon}
                  size={14}
                  style={{ color: cat.color }}
                />
              </span>
              {cat.name}
              <span className="text-[11px] text-sub">{cat.count}건</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[13px] text-text font-medium">
                {fmt(cat.value)}
              </span>
              <span className="text-[11px] text-sub">{cat.pct}%</span>
              <ChevronRight size={14} className="text-sub" />
            </span>
          </button>
        ))}
      </div>

      {/* Category Transaction Modal */}
      <CategoryTransactionModal
        open={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        transactions={categoryTxs}
        fmt={fmt}
        year={year}
        month={month}
      />
    </div>
  );
});

CategoryBreakdown.displayName = "CategoryBreakdown";

export default CategoryBreakdown;

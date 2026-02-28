import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import CategoryIcon from "../../components/CategoryIcon";

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

const CategoryPieChart = ({ transactions, fmt }) => {
  const { chartData, total } = useMemo(() => {
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
            value: 0,
          };
        }
        map[key].value += tx.amount;
      });

    const sorted = Object.values(map).sort((a, b) => b.value - a.value);
    const tot = sorted.reduce((s, c) => s + c.value, 0);
    const top5 = sorted.slice(0, 5).map((c) => ({
      ...c,
      pct: tot > 0 ? Math.round((c.value / tot) * 100) : 0,
    }));

    if (sorted.length > 5) {
      const rest = sorted.slice(5).reduce((s, c) => s + c.value, 0);
      top5.push({
        name: "기타",
        icon: "Package",
        color: "#cbd5e1",
        value: rest,
        pct: tot > 0 ? Math.round((rest / tot) * 100) : 0,
      });
    }

    return { chartData: top5, total: tot };
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-3">
          카테고리별 지출
        </h3>
        <p className="text-[13px] text-sub">지출 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-[13px] text-sub font-medium mb-3">카테고리별 지출</h3>

      <div className="w-full flex justify-center" style={{ height: 200 }}>
        <PieChart width={200} height={200}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry) => (
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

      {/* 범례 */}
      <div className="flex flex-col gap-2 mt-3">
        {chartData.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center justify-between text-[13px]"
          >
            <span className="flex items-center gap-1.5 text-text truncate">
              <CategoryIcon
                name={cat.icon}
                size={14}
                style={{ color: cat.color }}
              />
              {cat.name}
            </span>
            <span className="text-sub font-medium shrink-0 ml-2">
              {fmt(cat.value)} · {cat.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPieChart;

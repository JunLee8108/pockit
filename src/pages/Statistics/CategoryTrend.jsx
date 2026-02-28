import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import useContainerWidth from "../../hooks/useContainerWidth";
import CategoryIcon from "../../components/CategoryIcon";

const CHART_HEIGHT = 240;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-3 text-[12px]">
      <div className="font-medium text-text mb-1">{label}</div>
      <div style={{ color: payload[0]?.stroke }}>
        {payload[0]?.value?.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
      </div>
    </div>
  );
};

const CategoryTrend = ({ trendData, categories, divisor }) => {
  const { ref, width } = useContainerWidth();
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );
  const [selectedId, setSelectedId] = useState("");

  const activeId = selectedId || expenseCategories[0]?.id || "";
  const activeCat = expenseCategories.find((c) => c.id === activeId);

  const chartData = useMemo(() => {
    return trendData.map((m) => {
      const total = m.transactions
        .filter((tx) => tx.type === "expense" && tx.category_id === activeId)
        .reduce((s, tx) => s + tx.amount, 0);
      return { label: m.label, amount: total / divisor };
    });
  }, [trendData, activeId, divisor]);

  if (expenseCategories.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-3">
          카테고리 트렌드
        </h3>
        <p className="text-[13px] text-sub">카테고리가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-[13px] text-sub font-medium">카테고리 트렌드</h3>
        <select
          value={activeId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="px-3 py-1.5 bg-bg border border-border rounded-lg text-[13px] text-text outline-none"
        >
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {activeCat && (
        <div className="flex items-center gap-2 mb-3">
          <CategoryIcon
            name={activeCat.icon}
            size={16}
            style={{ color: activeCat.color }}
          />
          <span className="text-[14px] font-medium text-text">
            {activeCat.name}
          </span>
        </div>
      )}

      <div ref={ref} className="w-full" style={{ height: CHART_HEIGHT }}>
        {width > 0 && (
          <LineChart
            width={width}
            height={CHART_HEIGHT}
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 0, left: -10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-sub)", fontSize: 12 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-sub)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke={activeCat?.color || "var(--color-sub)"}
              strokeWidth={2.5}
              dot={{ r: 4, fill: activeCat?.color || "var(--color-sub)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </div>
    </div>
  );
};

export default CategoryTrend;

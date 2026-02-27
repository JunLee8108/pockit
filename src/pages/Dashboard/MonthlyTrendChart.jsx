import { useState, useRef, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const CHART_HEIGHT = 280;

const useContainerWidth = () => {
  const [width, setWidth] = useState(0);
  const elRef = useRef(null);
  const roRef = useRef(null);

  const ref = useCallback((node) => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }

    elRef.current = node;

    if (node) {
      // DOM 부착 즉시 측정
      setWidth(node.offsetWidth);

      // 이후 리사이즈 대응
      roRef.current = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (w && w > 0) setWidth(Math.floor(w));
      });
      roRef.current.observe(node);
    }
  }, []);

  useEffect(() => {
    return () => roRef.current?.disconnect();
  }, []);

  return { ref, width };
};

const formatAxis = (v) => {
  if (v >= 100000000) return `${(v / 100000000).toFixed(0)}억`;
  if (v >= 10000) return `${Math.round(v / 10000)}만`;
  return v.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-3 text-[12px]">
      <div className="font-medium text-text mb-1.5">{label}</div>
      {payload.map((p) => (
        <div
          key={p.name}
          className="flex justify-between gap-6"
          style={{ color: p.fill }}
        >
          <span>{p.name}</span>
          <span className="font-medium">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const MonthlyTrendChart = ({ data }) => {
  const { ref, width } = useContainerWidth();
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-4">
          수입/지출 추이
        </h3>
        <div className="h-[200px] flex items-center justify-center text-[13px] text-sub">
          거래 데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-[13px] text-sub font-medium mb-4">수입/지출 추이</h3>
      <div ref={ref} className="w-full" style={{ height: CHART_HEIGHT }}>
        {width > 0 && (
          <BarChart
            width={width}
            height={CHART_HEIGHT}
            data={data}
            barGap={4}
            margin={{ top: 5, right: 5, bottom: 0, left: -10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAxis}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-light)" }}
            />
            <Bar
              dataKey="income"
              name="수입"
              fill="#6dd4b4"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expense"
              name="지출"
              fill="#f4845f"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        )}
      </div>
    </div>
  );
};

export default MonthlyTrendChart;

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import useContainerWidth from "../../hooks/useContainerWidth";

const CHART_HEIGHT = 240;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-3 text-[12px]">
      <div className="font-medium text-text mb-1">{label}일</div>
      <div className="text-coral">
        {payload[0]?.value?.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
      </div>
    </div>
  );
};

const DailyFlowChart = ({ transactions, year, month, divisor }) => {
  const { ref, width } = useContainerWidth();

  const { chartData, avgDaily } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const daily = {};
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const day = parseInt(tx.date.split("-")[2], 10);
        daily[day] = (daily[day] || 0) + tx.amount;
      });

    const data = [];
    let total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const val = (daily[d] || 0) / divisor;
      total += val;
      data.push({ date: String(d), amount: val });
    }

    const daysWithData = Object.keys(daily).length || 1;
    return { chartData: data, avgDaily: total / daysWithData };
  }, [transactions, year, month, divisor]);

  const hasData = chartData.some((d) => d.amount > 0);

  if (!hasData) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-4">
          일별 지출 흐름
        </h3>
        <div className="h-[160px] flex items-center justify-center text-[13px] text-sub">
          지출 데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] text-sub font-medium">일별 지출 흐름</h3>
        <span className="text-[12px] text-sub">
          일 평균:{" "}
          <span className="font-medium text-coral">
            {avgDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </span>
      </div>
      <div ref={ref} className="w-full" style={{ height: CHART_HEIGHT }}>
        {width > 0 && (
          <AreaChart
            width={width}
            height={CHART_HEIGHT}
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 0, left: -10 }}
          >
            <defs>
              <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4845f" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f4845f" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-sub)", fontSize: 11 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--color-sub)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgDaily}
              stroke="var(--color-sub)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#f4845f"
              strokeWidth={2}
              fill="url(#coralGrad)"
            />
          </AreaChart>
        )}
      </div>
    </div>
  );
};

export default DailyFlowChart;

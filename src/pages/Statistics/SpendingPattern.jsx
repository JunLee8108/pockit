import { useState, useMemo } from "react";
import CategoryIcon from "../../components/CategoryIcon";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const SpendingPattern = ({ transactions, year, month, divisor, fmt }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  const { calendar, maxAmount, dailyTxMap } = useMemo(() => {
    const daily = {};
    const txMap = {};

    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const day = parseInt(tx.date.split("-")[2], 10);
        daily[day] = (daily[day] || 0) + tx.amount;
        if (!txMap[day]) txMap[day] = [];
        txMap[day].push(tx);
      });

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks = [];
    let week = new Array(firstDay).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
      week.push({ day: d, amount: (daily[d] || 0) / divisor });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const max = Math.max(...Object.values(daily).map((v) => v / divisor), 1);

    return { calendar: weeks, maxAmount: max, dailyTxMap: txMap };
  }, [transactions, year, month, divisor]);

  const getColor = (amount) => {
    if (!amount || amount === 0)
      return { bg: "var(--color-light)", intensity: 0 };
    const intensity = Math.min(amount / maxAmount, 1);
    const alpha = 0.15 + intensity * 0.7;
    return { bg: `rgba(244, 132, 95, ${alpha})`, intensity };
  };

  const handleDayClick = (day) => {
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const selectedTxs = selectedDay ? dailyTxMap[selectedDay] || [] : [];
  const selectedTotal = selectedTxs.reduce((s, tx) => s + tx.amount, 0);
  const selectedWeekday = selectedDay
    ? WEEKDAY_NAMES[new Date(year, month - 1, selectedDay).getDay()]
    : "";

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-[13px] text-sub font-medium mb-4">일별 지출 패턴</h3>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-[11px] text-sub text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="flex flex-col gap-1.5">
        {calendar.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((cell, ci) =>
              cell ? (
                <div
                  key={ci}
                  onClick={() => handleDayClick(cell.day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                    selectedDay === cell.day
                      ? "ring-2 ring-mint ring-offset-1"
                      : ""
                  }`}
                  style={{ backgroundColor: getColor(cell.amount).bg }}
                >
                  <span
                    className={`text-[12px] font-medium ${
                      getColor(cell.amount).intensity > 0.5
                        ? "text-white"
                        : "text-text"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {cell.amount > 0 && (
                    <span
                      className={`text-[9px] leading-tight ${
                        getColor(cell.amount).intensity > 0.5
                          ? "text-white/80"
                          : "text-sub"
                      }`}
                    >
                      {cell.amount >= 1000
                        ? `${(cell.amount / 1000).toFixed(1)}k`
                        : cell.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              ) : (
                <div key={ci} />
              ),
            )}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[11px] text-sub">적음</span>
        {[0.15, 0.35, 0.55, 0.75, 0.85].map((a) => (
          <div
            key={a}
            className="w-3.5 h-3.5 rounded"
            style={{ backgroundColor: `rgba(244, 132, 95, ${a})` }}
          />
        ))}
        <span className="text-[11px] text-sub">많음</span>
      </div>

      {/* 선택된 날짜 거래 상세 */}
      {selectedDay && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-medium text-text">
              {month}월 {selectedDay}일 ({selectedWeekday})
            </span>
            <span className="text-[13px] font-semibold text-coral">
              {fmt(selectedTotal)}
            </span>
          </div>

          {selectedTxs.length === 0 ? (
            <p className="text-[12px] text-sub">지출 내역이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {selectedTxs.map((tx) => (
                <div key={tx.id} className="flex items-center gap-2.5 py-1.5">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: tx.category?.color
                        ? tx.category.color + "18"
                        : "var(--color-light)",
                    }}
                  >
                    <CategoryIcon
                      name={tx.category?.icon}
                      size={14}
                      style={{
                        color: tx.category?.color || "#94a3b8",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text truncate">
                      {tx.description || tx.category?.name || "거래"}
                    </div>
                    <div className="text-[11px] text-sub truncate">
                      {tx.category?.name}
                      {tx.account?.name && ` · ${tx.account.name}`}
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-coral shrink-0">
                    {fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpendingPattern;

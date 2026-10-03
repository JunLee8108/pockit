import {
  WEEKDAY_CODES,
  WEEKDAY_LABELS,
  presetOptions,
  monthlyOptions,
  customFromPreset,
} from "../../utils/recurrence";

const inputCls =
  "px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint disabled:opacity-50";

const UNITS = [
  { value: "DAILY", label: "일" },
  { value: "WEEKLY", label: "주" },
  { value: "MONTHLY", label: "개월" },
  { value: "YEARLY", label: "년" },
];

// 구글 캘린더식 반복 선택: 프리셋 드롭다운 + 맞춤 설정
// date: 프리셋 라벨/요일 계산 기준일
const RecurrencePicker = ({ date, preset, onPresetChange, custom, onCustomChange }) => {
  const options = presetOptions(date);
  const update = (patch) => onCustomChange({ ...custom, ...patch });

  const handlePreset = (key) => {
    if (key === "custom" && preset !== "custom") {
      onCustomChange(customFromPreset(preset, date));
    }
    onPresetChange(key);
  };

  const toggleDay = (code) => {
    const next = custom.byday.includes(code)
      ? custom.byday.filter((c) => c !== code)
      : [...custom.byday, code];
    if (next.length) update({ byday: next });
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={options.some((o) => o.key === preset) ? preset : "custom"}
        onChange={(e) => handlePreset(e.target.value)}
        disabled={!date}
        className={`w-full ${inputCls} py-2.5 px-4`}
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>

      {preset === "custom" && date && (
        <div className="flex flex-col gap-3 p-3 bg-light rounded-lg">
          {/* 주기 */}
          <div className="flex items-center gap-2 text-[13px] text-sub">
            <span className="shrink-0">반복 주기</span>
            <input
              type="number"
              min={1}
              max={99}
              value={custom.interval}
              onChange={(e) =>
                update({ interval: Math.max(1, Number(e.target.value) || 1) })
              }
              className={`w-16 ${inputCls}`}
            />
            <select
              value={custom.freq}
              onChange={(e) => {
                const freq = e.target.value;
                update({
                  freq,
                  byday:
                    freq === "WEEKLY" && !custom.byday.length
                      ? customFromPreset("weekly", date).byday
                      : custom.byday,
                });
              }}
              className={inputCls}
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            <span className="shrink-0">마다</span>
          </div>

          {/* 주간: 요일 */}
          {custom.freq === "WEEKLY" && (
            <div className="flex gap-1">
              {WEEKDAY_CODES.map((code, i) => {
                const on = custom.byday.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleDay(code)}
                    className={`flex-1 h-8 rounded-full text-[12px] font-medium cursor-pointer border-none transition-colors ${
                      on ? "bg-mint text-white" : "bg-surface text-sub"
                    }`}
                  >
                    {WEEKDAY_LABELS[i]}
                  </button>
                );
              })}
            </div>
          )}

          {/* 월간: 날짜 / N번째 요일 */}
          {custom.freq === "MONTHLY" && (
            <select
              value={custom.monthMode}
              onChange={(e) => update({ monthMode: e.target.value })}
              className={inputCls}
            >
              {monthlyOptions(date).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}

          {/* 종료 */}
          <div className="flex flex-col gap-1.5 text-[13px] text-text">
            <span className="text-sub">종료</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={custom.endType === "never"}
                onChange={() => update({ endType: "never" })}
                className="accent-mint"
              />
              없음
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={custom.endType === "until"}
                onChange={() => update({ endType: "until" })}
                className="accent-mint"
              />
              <span className="shrink-0">날짜</span>
              <input
                type="date"
                value={custom.until}
                min={date}
                onChange={(e) => update({ endType: "until", until: e.target.value })}
                disabled={custom.endType !== "until"}
                className={inputCls}
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={custom.endType === "count"}
                onChange={() => update({ endType: "count" })}
                className="accent-mint"
              />
              <input
                type="number"
                min={1}
                max={999}
                value={custom.count}
                onChange={(e) =>
                  update({ count: Math.max(1, Number(e.target.value) || 1) })
                }
                disabled={custom.endType !== "count"}
                className={`w-20 ${inputCls}`}
              />
              <span>회 반복 후</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrencePicker;

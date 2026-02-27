import { ChevronLeft, ChevronRight } from "lucide-react";

const PeriodSelector = ({ year, month, onChange }) => {
  const go = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange(y, m);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(-1)}
        className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-[15px] font-semibold text-text min-w-[120px] text-center">
        {year}년 {month}월
      </span>
      <button
        onClick={() => go(1)}
        className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default PeriodSelector;

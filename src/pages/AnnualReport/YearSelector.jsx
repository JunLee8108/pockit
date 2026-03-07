import { ChevronLeft, ChevronRight } from "lucide-react";

const YearSelector = ({ year, onChange }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onChange(year - 1)}
      className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
    >
      <ChevronLeft size={18} />
    </button>
    <span className="text-[15px] font-semibold text-text min-w-[80px] text-center">
      {year}년
    </span>
    <button
      onClick={() => onChange(year + 1)}
      className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
    >
      <ChevronRight size={18} />
    </button>
  </div>
);

export default YearSelector;

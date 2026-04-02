import { useState } from "react";
import { X } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";

const ANIM_DURATION = 250;

const CategoryTransactionModal = ({
  open,
  onClose,
  category,
  transactions,
  fmt,
  year,
  month,
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  if (open && !visible && !closing) {
    setVisible(true);
  }

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      onClose();
    }, ANIM_DURATION);
  };

  if (!visible || !category) return null;

  const animating = closing;
  const total = transactions.reduce((s, tx) => s + tx.amount, 0);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        className={`fixed inset-0 bg-black/30 ${animating ? "animate-fadeOut" : "animate-fadeIn"}`}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative overscroll-contain bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-[500px] max-h-[80vh] flex flex-col ${
          animating ? "animate-slideDown" : "animate-slideUp"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: category.color + "18" }}
            >
              <CategoryIcon
                name={category.icon}
                size={18}
                style={{ color: category.color }}
              />
            </span>
            <div>
              <h3 className="text-[16px] font-semibold text-text">
                {category.name}
              </h3>
              <p className="text-[12px] text-sub">
                {year}년 {month}월 거래내역
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto px-5">
          {transactions.length === 0 ? (
            <p className="text-[13px] text-sub py-6 text-center">
              거래 내역이 없습니다
            </p>
          ) : (
            <div className="flex flex-col">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-text truncate">
                      {tx.description || "거래"}
                    </div>
                    <div className="text-[12px] text-sub">
                      {tx.date} · {tx.account?.name || ""}
                    </div>
                  </div>
                  <span className="text-[14px] font-semibold text-coral shrink-0">
                    {fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="flex items-center justify-between p-5 pt-3 border-t border-border shrink-0">
          <span className="text-[13px] text-sub">
            총 {transactions.length}건
          </span>
          <span className="text-[15px] font-bold text-text">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default CategoryTransactionModal;

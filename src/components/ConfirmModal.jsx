import { useState } from "react";
import useConfirmStore from "../store/useConfirmStore";

const ANIM_DURATION = 200;

const VARIANT_STYLES = {
  danger: "bg-coral hover:bg-[#e5734f]",
  warning: "bg-amber hover:bg-[#e5be35] text-text",
  info: "bg-mint hover:bg-mint-hover",
};

const ConfirmModal = () => {
  const { open, title, message, confirmText, cancelText, variant, close } =
    useConfirmStore();

  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // 렌더 중 동기 세팅 — 기존 모달 패턴과 동일
  if (open && !visible && !closing) {
    setVisible(true);
  }

  const handleClose = (result) => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      close(result);
    }, ANIM_DURATION);
  };

  if (!visible) return null;

  const animating = closing;
  const btnStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.danger;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      onClick={() => handleClose(false)}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 ${animating ? "animate-fadeOut" : "animate-fadeIn"}`}
      />

      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-surface border border-border rounded-2xl p-6 w-full max-w-[360px] ${
          animating ? "animate-slideDown" : "animate-slideUp"
        }`}
      >
        {/* Title */}
        <h3 className="text-[16px] font-semibold text-text mb-2">{title}</h3>

        {/* Message */}
        {message && (
          <p className="text-[14px] text-sub leading-relaxed whitespace-pre-line mb-6">
            {message}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {cancelText !== "" && (
            <button
              onClick={() => handleClose(false)}
              className="flex-1 py-2.5 rounded-lg text-[14px] font-medium bg-light text-sub border-none cursor-pointer transition-colors hover:bg-border"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => handleClose(true)}
            className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white border-none cursor-pointer transition-colors ${btnStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

import { useState, useEffect } from "react";

const ANIM_DURATION = 250;

const BottomSheet = ({ open, onClose, children }) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  if (open && !visible && !closing) {
    setVisible(true);
  }

  // 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (visible && !closing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible, closing]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      onClose();
    }, ANIM_DURATION);
  };

  if (!visible) return null;

  const animating = closing;

  return (
    <div className="fixed inset-0 z-[80] flex items-end" onClick={handleClose}>
      <div
        className={`fixed inset-0 bg-black/30 ${animating ? "animate-fadeOut" : "animate-fadeIn"}`}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full bg-surface border-t border-border rounded-t-2xl ${
          animating ? "animate-slideDown" : "animate-slideUp"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {children}
      </div>
    </div>
  );
};

export default BottomSheet;

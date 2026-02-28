import { useState, useRef, useCallback, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";

const ACTION_WIDTH = 120;
const THRESHOLD = 60;

const SwipeableCard = ({
  children,
  cardId,
  openCardId,
  onOpenChange,
  onEdit,
  onDelete,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const dirLocked = useRef(null);
  const contentRef = useRef(null);
  const isOpen = openCardId === cardId;

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const displayOffset = dragging ? offsetX : isOpen ? -ACTION_WIDTH : 0;

  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    dirLocked.current = null;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;

    if (!dirLocked.current) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        dirLocked.current = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
      }
      return;
    }

    if (dirLocked.current === "v") return;

    // passive: false로 등록했으므로 실제로 스크롤 차단됨
    e.preventDefault();

    const base = isOpenRef.current ? -ACTION_WIDTH : 0;
    const next = Math.min(0, Math.max(-ACTION_WIDTH, base + dx));
    setOffsetX(next);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    dirLocked.current = null;

    setOffsetX((prev) => {
      if (prev < -THRESHOLD) {
        onOpenChange(cardId);
        return -ACTION_WIDTH;
      } else {
        if (isOpenRef.current) onOpenChange(null);
        return 0;
      }
    });
  }, [cardId, onOpenChange]);

  // passive: false로 직접 등록
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="swipe-card relative overflow-hidden rounded-xl">
      <div className="swipe-actions absolute right-0 top-0 bottom-0 flex">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
            onOpenChange(null);
          }}
          className="w-[60px] flex items-center justify-center bg-mint text-white border-none cursor-pointer"
          aria-label="수정"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            onOpenChange(null);
          }}
          className="w-[60px] flex items-center justify-center bg-coral text-white border-none cursor-pointer"
          aria-label="삭제"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div
        ref={contentRef}
        style={{
          transform: `translateX(${displayOffset}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          willChange: "transform",
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;

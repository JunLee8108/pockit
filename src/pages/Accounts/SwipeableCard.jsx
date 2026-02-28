import { useState, useRef, useCallback, useEffect } from "react";

const BTN_WIDTH = 60;
const THRESHOLD = 50;

const SwipeableCard = ({
  children,
  cardId,
  openCardId,
  onOpenChange,
  actions = [],
}) => {
  const actionWidth = actions.length * BTN_WIDTH;
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

  const actionWidthRef = useRef(actionWidth);
  useEffect(() => {
    actionWidthRef.current = actionWidth;
  }, [actionWidth]);

  const displayOffset = dragging ? offsetX : isOpen ? -actionWidth : 0;

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

    e.preventDefault();

    const w = actionWidthRef.current;
    const base = isOpenRef.current ? -w : 0;
    const next = Math.min(0, Math.max(-w, base + dx));
    setOffsetX(next);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    dirLocked.current = null;

    setOffsetX((prev) => {
      const w = actionWidthRef.current;
      if (prev < -THRESHOLD) {
        onOpenChange(cardId);
        return -w;
      } else {
        if (isOpenRef.current) onOpenChange(null);
        return 0;
      }
    });
  }, [cardId, onOpenChange]);

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
      {/* 뒷면: 액션 버튼 */}
      <div
        className="swipe-actions absolute right-0 top-0 bottom-0 flex"
        style={{ opacity: isOpen || dragging ? 1 : 0 }}
      >
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onOpenChange(null);
            }}
            className={`w-[60px] flex items-center justify-center text-white border-none cursor-pointer ${action.className || ""}`}
            style={action.style}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>

      {/* 앞면: 카드 콘텐츠 */}
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

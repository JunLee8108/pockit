import { useState, useRef, useCallback, useEffect } from "react";

const BTN_WIDTH = 60;
const THRESHOLD = 25;
const VELOCITY_THRESHOLD = 0.3;
const DIR_LOCK_THRESHOLD = 6; // 방향 판정 구간 축소

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
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const dirLocked = useRef(null);
  const didSwipeRef = useRef(false);
  const contentRef = useRef(null);
  const lastTouchRef = useRef({ x: 0, time: 0 });
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
    const now = Date.now();
    startRef.current = { x: t.clientX, y: t.clientY, time: now };
    lastTouchRef.current = { x: t.clientX, time: now };
    dirLocked.current = null;
    didSwipeRef.current = false;
    setOffsetX(isOpenRef.current ? -actionWidthRef.current : 0);
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;

    if (!dirLocked.current) {
      if (
        Math.abs(dx) > DIR_LOCK_THRESHOLD ||
        Math.abs(dy) > DIR_LOCK_THRESHOLD
      ) {
        dirLocked.current = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
        // 수평 잠금 → touch-action none으로 브라우저 제스처 완전 차단
        if (dirLocked.current === "h" && contentRef.current) {
          contentRef.current.style.touchAction = "none";
        }
      }
      return;
    }

    if (dirLocked.current === "v") return;

    e.preventDefault();
    didSwipeRef.current = true;

    lastTouchRef.current = { x: t.clientX, time: Date.now() };

    const w = actionWidthRef.current;
    const base = isOpenRef.current ? -w : 0;
    const next = Math.min(0, Math.max(-w, base + dx));
    setOffsetX(next);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    dirLocked.current = null;

    // touch-action 복원
    if (contentRef.current) {
      contentRef.current.style.touchAction = "pan-y";
    }

    // velocity 계산
    const dt = Date.now() - lastTouchRef.current.time;
    const dx = lastTouchRef.current.x - startRef.current.x;
    const velocity = dt > 0 ? Math.abs(dx) / dt : 0; // px/ms

    setOffsetX((prev) => {
      const w = actionWidthRef.current;
      const wasOpen = isOpenRef.current;

      // 빠른 flick → 방향만 보고 판단
      if (velocity > VELOCITY_THRESHOLD) {
        if (dx < 0 && !wasOpen) {
          onOpenChange(cardId);
          return -w;
        }
        if (dx > 0 && wasOpen) {
          onOpenChange(null);
          return 0;
        }
      }

      // 느린 드래그 → 거리 기준 판단
      if (prev < -THRESHOLD) {
        onOpenChange(cardId);
        return -w;
      } else {
        if (wasOpen) onOpenChange(null);
        return 0;
      }
    });
  }, [cardId, onOpenChange]);

  const handleContentClick = useCallback(
    (e) => {
      if (didSwipeRef.current) {
        e.stopPropagation();
        didSwipeRef.current = false;
        return;
      }
      if (isOpenRef.current) {
        e.stopPropagation();
        onOpenChange(null);
      }
    },
    [onOpenChange],
  );

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

      <div
        ref={contentRef}
        onClick={handleContentClick}
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

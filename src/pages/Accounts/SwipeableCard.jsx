import { useState, useRef, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";

const ACTION_WIDTH = 120; // 버튼 2개 × 60px
const THRESHOLD = 60; // 이 이상 스와이프하면 열림

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
  const dirLocked = useRef(null); // "h" | "v" | null
  const isOpen = openCardId === cardId;

  // 드래그 중엔 offsetX, 아닐 땐 isOpen 상태로 결정
  const displayOffset = dragging ? offsetX : isOpen ? -ACTION_WIDTH : 0;

  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    dirLocked.current = null;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      const t = e.touches[0];
      const dx = t.clientX - startRef.current.x;
      const dy = t.clientY - startRef.current.y;

      // 방향 잠금: 처음 10px 이동으로 판단
      if (!dirLocked.current) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          dirLocked.current = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
        }
        return;
      }

      // 세로 스크롤이면 무시
      if (dirLocked.current === "v") return;

      e.preventDefault(); // 가로 스와이프 시 스크롤 방지

      const base = isOpen ? -ACTION_WIDTH : 0;
      const next = Math.min(0, Math.max(-ACTION_WIDTH, base + dx));
      setOffsetX(next);
    },
    [isOpen],
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    dirLocked.current = null;

    if (offsetX < -THRESHOLD) {
      // 열기
      setOffsetX(-ACTION_WIDTH);
      onOpenChange(cardId);
    } else {
      // 닫기
      setOffsetX(0);
      if (isOpen) onOpenChange(null);
    }
  }, [offsetX, cardId, isOpen, onOpenChange]);

  return (
    <div className="swipe-card relative overflow-hidden rounded-xl">
      {/* 뒷면: 액션 버튼 */}
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

      {/* 앞면: 카드 콘텐츠 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${displayOffset}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;

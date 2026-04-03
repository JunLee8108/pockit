import { useState, useRef, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router";
import useDashboardAlerts from "../../hooks/useDashboardAlerts";
import CategoryIcon from "../../components/CategoryIcon";

const ANIM_DURATION = 200;

const DashboardAlerts = ({ fmt }) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const ref = useRef(null);
  const alerts = useDashboardAlerts(fmt);

  const openDropdown = useCallback(() => {
    setVisible(true);
    setAnimating(true);
    requestAnimationFrame(() => setAnimating(false));
  }, []);

  const closeDropdown = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setVisible(false);
      setAnimating(false);
    }, ANIM_DURATION);
  }, []);

  const toggle = useCallback(() => {
    if (visible && !animating) closeDropdown();
    else if (!visible) openDropdown();
  }, [visible, animating, openDropdown, closeDropdown]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) closeDropdown();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, closeDropdown]);

  // ESC 닫기
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (e.key === "Escape") closeDropdown();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, closeDropdown]);

  const count = alerts.length;

  // 열린 직후: animating=true → false (entering)
  // 닫는 중: animating=true, visible=true (exiting)
  const isEntering = visible && !animating;
  const isExiting = visible && animating && !isEntering;

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={toggle}
        className="relative p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none transition-colors"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-coral text-white text-[10px] font-bold leading-none">
            {count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {visible && (
        <div
          className={`absolute right-0 top-10 w-[300px] sm:w-[340px] dash-card bg-surface shadow-lg rounded-2xl py-3 z-[100] transition-all origin-top-right ${
            isEntering
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95"
          }`}
          style={{ transitionDuration: `${ANIM_DURATION}ms` }}
        >
          <div className="px-4 pb-2 mb-1 border-b border-border">
            <span className="text-[13px] text-text font-semibold">
              알림
            </span>
            {count > 0 && (
              <span className="text-[12px] text-sub ml-1.5">{count}건</span>
            )}
          </div>

          {count === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-sub">
              새로운 알림이 없습니다
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto">
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  to={alert.link}
                  onClick={closeDropdown}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-light transition-colors no-underline"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: alert.iconColor + "18" }}
                  >
                    <CategoryIcon
                      name={alert.icon}
                      size={13}
                      style={{ color: alert.iconColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-text truncate">
                      {alert.label}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${alert.typeBg} ${alert.typeColor}`}
                      >
                        {alert.type}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${alert.badgeColor}`}
                      >
                        {alert.badge}
                      </span>
                    </div>
                  </div>
                  <span className="text-[12px] font-semibold text-text shrink-0">
                    {alert.detailFormatted}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardAlerts;

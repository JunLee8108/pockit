import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  MoreHorizontal,
  Landmark,
  Tag,
  Sun,
  Moon,
  Monitor,
  LogOut,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";
import BottomSheet from "../components/BottomSheet";

const TABS = [
  { path: "/", icon: LayoutDashboard, label: "대시보드" },
  { path: "/transactions", icon: Receipt, label: "거래" },
  { path: "/budget", icon: PiggyBank, label: "예산" },
  { path: "/statistics", icon: BarChart3, label: "통계" },
];

const themeLabels = { light: "라이트", system: "시스템", dark: "다크" };
const themeIcons = { light: Sun, system: Monitor, dark: Moon };
const themeOrder = ["light", "system", "dark"];

const NavTab = ({ tab, isActive, onNavigate }) => {
  const touchedRef = useRef(false);

  const handleTouchEnd = useCallback(
    (e) => {
      e.preventDefault();
      touchedRef.current = true;
      onNavigate(tab.path);
    },
    [tab.path, onNavigate],
  );

  const handleClick = useCallback(() => {
    if (touchedRef.current) {
      touchedRef.current = false;
      return;
    }
    onNavigate(tab.path);
  }, [tab.path, onNavigate]);

  return (
    <button
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-[11px] bg-transparent border-none cursor-pointer active:opacity-60 select-none ${
        isActive ? "text-mint font-semibold" : "text-sub font-normal"
      }`}
      style={{
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <tab.icon size={22} />
      <span className="pointer-events-none">{tab.label}</span>
    </button>
  );
};

const BottomNav = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const moreTouchedRef = useRef(false);

  const cycleTheme = () => {
    const next =
      themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
    setTheme(next);
  };

  const ThemeIcon = themeIcons[theme] || Monitor;

  const handleNavigate = (path) => {
    setSheetOpen(false);
    navigate(path);
  };

  const isTabActive = (tab) => {
    if (tab.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(tab.path);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 px-4 pb-4 left-0 right-0 bg-surface border-t border-border z-50 pointer-events-auto select-none"
        style={{
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          transform: "translateZ(0)",
        }}
      >
        <div className="h-16 flex items-stretch justify-around">
          {TABS.map((tab) => (
            <NavTab
              key={tab.path}
              tab={tab}
              isActive={isTabActive(tab)}
              onNavigate={handleNavigate}
            />
          ))}

          {/* 더보기 */}
          <button
            onTouchEnd={(e) => {
              e.preventDefault();
              moreTouchedRef.current = true;
              setSheetOpen(true);
            }}
            onClick={() => {
              if (moreTouchedRef.current) {
                moreTouchedRef.current = false;
                return;
              }
              setSheetOpen(true);
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-[11px] bg-transparent border-none cursor-pointer active:opacity-60 select-none ${
              sheetOpen ? "text-mint font-semibold" : "text-sub font-normal"
            }`}
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <MoreHorizontal size={22} />
            <span className="pointer-events-none">더보기</span>
          </button>
        </div>
      </nav>

      {/* 더보기 시트 */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-4 pt-2 pb-6 flex flex-col gap-1">
          {/* 메뉴 항목 */}
          <button
            onClick={() => handleNavigate("/accounts")}
            className="flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm text-text bg-transparent border-none cursor-pointer active:bg-light transition-colors w-full text-left"
          >
            <Landmark size={18} className="text-sub shrink-0" />
            <span>계좌 관리</span>
          </button>

          <button
            onClick={() => handleNavigate("/categories")}
            className="flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm text-text bg-transparent border-none cursor-pointer active:bg-light transition-colors w-full text-left"
          >
            <Tag size={18} className="text-sub shrink-0" />
            <span>카테고리 관리</span>
          </button>

          <div className="h-px bg-border my-1" />

          {/* 테마 */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm text-text bg-transparent border-none cursor-pointer active:bg-light transition-colors w-full text-left"
          >
            <ThemeIcon size={18} className="text-sub shrink-0" />
            <span>테마</span>
            <span className="ml-auto text-[12px] text-sub">
              {themeLabels[theme]}
            </span>
          </button>

          {/* 로그아웃 */}
          <button
            onClick={() => {
              setSheetOpen(false);
              signOut();
            }}
            className="flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm text-sub bg-transparent border-none cursor-pointer active:bg-light transition-colors w-full text-left"
          >
            <LogOut size={18} className="shrink-0" />
            <span>로그아웃</span>
          </button>
        </div>
      </BottomSheet>
    </>
  );
};

export default BottomNav;

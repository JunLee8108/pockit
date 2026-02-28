import { Menu, Sun, Moon, Monitor } from "lucide-react";
import useUIStore from "../store/useUIStore";
import useThemeStore from "../store/useThemeStore";

const themeIcons = { light: Sun, system: Monitor, dark: Moon };
const themeOrder = ["light", "system", "dark"];

const MobileHeader = () => {
  const { openMobileDrawer } = useUIStore();
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    const next =
      themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
    setTheme(next);
  };

  const ThemeIcon = themeIcons[theme] || Monitor;

  return (
    <header
      className="
        fixed top-0 left-0 right-0 h-14 z-50
        bg-surface border-b border-border
        flex items-center justify-between px-4
        pt-[env(safe-area-inset-top)]
      "
    >
      {/* 왼쪽: 햄버거 */}
      <button
        onClick={openMobileDrawer}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-sub"
        aria-label="메뉴 열기"
      >
        <Menu size={22} />
      </button>

      {/* 중앙: 페이지 타이틀 */}
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-bold text-text">Pockit</span>
      </div>

      {/* 오른쪽: 테마 토글 */}
      <button
        onClick={cycleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-sub"
        aria-label="테마 변경"
      >
        <ThemeIcon size={20} />
      </button>
    </header>
  );
};

export default MobileHeader;

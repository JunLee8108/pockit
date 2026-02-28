import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  Tag,
  Landmark,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { NAV_ITEMS } from "../utils/constants";
import useThemeStore from "../store/useThemeStore";

const iconMap = { LayoutDashboard, Receipt, BarChart3, Wallet, Tag, Landmark };

const themeIcons = { light: Sun, system: Monitor, dark: Moon };
const themeOrder = ["light", "system", "dark"];

const BottomNav = () => {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    const next =
      themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
    setTheme(next);
  };

  const ThemeIcon = themeIcons[theme] || Monitor;

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 h-14
        bg-surface border-t border-border
        flex items-center justify-around z-50
        pb-[env(safe-area-inset-bottom)]
      "
    >
      {NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.icon];
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5
              px-2 py-1 text-xs no-underline
              transition-colors duration-150
              ${isActive ? "text-mint font-semibold" : "text-sub font-normal"}
            `}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      {/* 테마 토글 */}
      <button
        onClick={cycleTheme}
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs text-sub bg-transparent border-none cursor-pointer"
      >
        <ThemeIcon size={20} />
        <span>테마</span>
      </button>
    </nav>
  );
};

export default BottomNav;

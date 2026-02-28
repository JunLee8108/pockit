import { Sun, Moon, Monitor } from "lucide-react";
import useThemeStore from "../store/useThemeStore";

const options = [
  { value: "light", icon: Sun, label: "라이트" },
  { value: "system", icon: Monitor, label: "시스템" },
  { value: "dark", icon: Moon, label: "다크" },
];

const ThemeToggle = ({ collapsed = false }) => {
  const { theme, setTheme } = useThemeStore();

  if (collapsed) {
    // 축소 사이드바: 아이콘만 순환
    const cycle = () => {
      const order = ["light", "system", "dark"];
      const next = order[(order.indexOf(theme) + 1) % order.length];
      setTheme(next);
    };
    const current = options.find((o) => o.value === theme);
    const Icon = current?.icon || Monitor;

    return (
      <button
        onClick={cycle}
        className="flex items-center justify-center w-full px-3 py-2.5 rounded-lg text-sub hover:bg-light bg-transparent border-none cursor-pointer transition-colors"
        title={current?.label}
      >
        <span className="shrink-0 flex items-center justify-center w-5">
          <Icon size={18} />
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center bg-light rounded-lg p-1 gap-0.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[12px] font-medium cursor-pointer border-none transition-colors ${
              active
                ? "bg-surface text-text shadow-sm"
                : "bg-transparent text-sub hover:text-text"
            }`}
            title={opt.label}
          >
            <Icon size={14} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;

import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  Tag,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from "lucide-react";
import { NAV_ITEMS } from "../utils/constants";
import useAuthStore from "../store/useAuthStore";
import useUIStore from "../store/useUIStore";

const iconMap = { LayoutDashboard, Receipt, BarChart3, Wallet, Tag, Landmark };

const Label = ({ collapsed, children }) => (
  <span
    className={`
      whitespace-nowrap overflow-hidden transition-all duration-200
      ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100 delay-100"}
    `}
  >
    {children}
  </span>
);

const Sidebar = ({ collapsed: collapsedProp }) => {
  const { profile, signOut } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const c = collapsedProp ?? sidebarCollapsed;

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-surface border-r border-border
        flex flex-col z-50 transition-[width] duration-200 ease-in-out overflow-hidden
        ${c ? "w-18" : "w-60"}
      `}
    >
      {/* Logo */}
      <div
        className={`
          h-14 flex items-center border-b border-border shrink-0
          ${c ? "justify-center px-2" : "justify-between px-5"}
        `}
      >
        {c ? (
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg bg-mint-bg flex items-center justify-center cursor-pointer border-none"
          >
            <ChevronRight size={16} className="text-mint" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-mint-bg flex items-center justify-center shrink-0">
                <Wallet size={18} className="text-mint" />
              </div>
              <Label collapsed={c}>
                <span className="text-[17px] font-bold text-text">Pockit</span>
              </Label>
            </div>
            <button
              onClick={toggleSidebar}
              className="text-sub cursor-pointer p-1 bg-transparent border-none shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-lg text-sm no-underline
                transition-colors duration-150 px-3 py-2.5
                ${
                  isActive
                    ? "text-mint bg-mint-bg font-semibold"
                    : "text-sub font-normal hover:bg-light"
                }
              `}
            >
              <span className="shrink-0 flex items-center justify-center w-5">
                <Icon size={18} />
              </span>
              <Label collapsed={c}>{item.label}</Label>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="p-3 border-t border-border shrink-0">
        {profile && (
          <div
            className={`
              px-3 py-2 text-[13px] text-sub truncate
              transition-all duration-200
              ${c ? "h-0 opacity-0 py-0 overflow-hidden" : "h-auto opacity-100"}
            `}
          >
            {profile.display_name}
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full rounded-lg text-sm text-sub bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-light px-3 py-2.5"
        >
          <span className="shrink-0 flex items-center justify-center w-5">
            <LogOut size={18} />
          </span>
          <Label collapsed={c}>로그아웃</Label>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

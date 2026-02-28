import { useEffect } from "react";
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  Tag,
  Landmark,
  LogOut,
  X,
} from "lucide-react";
import { NAV_ITEMS } from "../utils/constants";
import useUIStore from "../store/useUIStore";
import useAuthStore from "../store/useAuthStore";

const iconMap = { LayoutDashboard, Receipt, BarChart3, Wallet, Tag, Landmark };

const MobileDrawer = () => {
  const { mobileDrawerOpen, closeMobileDrawer } = useUIStore();
  const { profile, signOut } = useAuthStore();
  const { pathname } = useLocation();

  // 페이지 이동 시 드로어 닫기
  useEffect(() => {
    closeMobileDrawer();
  }, [pathname, closeMobileDrawer]);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`
          fixed inset-0 bg-black/40 z-[60]
          transition-opacity duration-200
          ${mobileDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={closeMobileDrawer}
      />

      {/* 드로어 패널 */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-surface z-[70]
          flex flex-col shadow-xl
          transition-transform duration-250 ease-in-out
          ${mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* 헤더 */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-border shrink-0 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mint-bg flex items-center justify-center">
              <Wallet size={18} className="text-mint" />
            </div>
            <span className="text-[17px] font-bold text-text">Pockit</span>
          </div>
          <button
            onClick={closeMobileDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-sub"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-lg text-sm no-underline
                  transition-colors duration-150 px-3 py-3
                  ${
                    isActive
                      ? "text-mint bg-mint-bg font-semibold"
                      : "text-sub font-normal hover:bg-light active:bg-light"
                  }
                `}
              >
                <span className="shrink-0 flex items-center justify-center w-5">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* 하단: 프로필 + 로그아웃 */}
        <div className="p-3 border-t border-border shrink-0 flex flex-col gap-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {profile && (
            <div className="px-3 py-2 text-[13px] text-sub truncate">
              {profile.display_name}
            </div>
          )}
          <button
            onClick={() => {
              closeMobileDrawer();
              signOut();
            }}
            className="flex items-center gap-3 w-full rounded-lg text-sm text-sub bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-light active:bg-light px-3 py-3"
          >
            <span className="shrink-0 flex items-center justify-center w-5">
              <LogOut size={18} />
            </span>
            <span>로그아웃</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default MobileDrawer;

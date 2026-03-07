import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import BottomNav from "../components/BottomNav";
import ConfirmModal from "../components/ConfirmModal";
import useUIStore from "../store/useUIStore";

const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

const Layout = () => {
  const viewport = useViewport();
  const { sidebarCollapsed } = useUIStore();

  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";
  const collapsed = isTablet ? true : sidebarCollapsed;

  return (
    <div className="min-h-screen bg-bg">
      {!isMobile && <Sidebar collapsed={collapsed} canToggle={!isTablet} />}

      {isMobile && <MobileHeader />}
      {isMobile && <BottomNav />}

      <main
        className={`min-h-screen ${isMobile ? "" : "transition-[margin] duration-200 ease-in-out"}`}
        style={{
          marginLeft: isMobile ? 0 : collapsed ? "4.5rem" : "15rem",
          paddingTop: isMobile ? "3.5rem" : 0,
          paddingBottom: isMobile
            ? "calc(5rem + env(safe-area-inset-bottom))"
            : 0,
        }}
      >
        <div className="max-w-[1200px] mx-auto p-6">
          <Outlet />
        </div>
      </main>

      <ConfirmModal />
    </div>
  );
};

export default Layout;

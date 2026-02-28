import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import MobileDrawer from "./MobileDrawer";
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
      {isMobile && <MobileDrawer />}

      <main
        className="min-h-screen transition-[margin] duration-200 ease-in-out"
        style={{
          marginLeft: isMobile ? 0 : collapsed ? "4.5rem" : "15rem",
          paddingTop: isMobile ? "3.5rem" : 0,
        }}
      >
        <div className="max-w-[1200px] mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

import { useState, useEffect } from "react";

const getViewport = (w) => {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const useViewport = () => {
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined" ? "desktop" : getViewport(window.innerWidth),
  );

  useEffect(() => {
    const onResize = () => setViewport(getViewport(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
};

export default useViewport;

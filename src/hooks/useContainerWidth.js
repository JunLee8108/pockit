import { useState, useRef, useCallback } from "react";

const useContainerWidth = () => {
  const [width, setWidth] = useState(0);
  const elRef = useRef(null);
  const roRef = useRef(null);

  const ref = useCallback((node) => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }
    elRef.current = node;
    if (node) {
      setWidth(node.offsetWidth);
      roRef.current = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (w && w > 0) setWidth(Math.floor(w));
      });
      roRef.current.observe(node);
    }
  }, []);

  return { ref, width };
};

export default useContainerWidth;

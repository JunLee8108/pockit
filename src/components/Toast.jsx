import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import useToastStore from "../store/useToastStore";

const STYLES = {
  success: {
    iconColor: "text-mint",
    icon: Check,
  },
  error: {
    iconColor: "text-coral",
    icon: X,
  },
};

const ToastItem = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const style = STYLES[toast.type] || STYLES.success;
  const Icon = style.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const duration = toast.type === "error" ? 3700 : 2700;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onRemove]);

  return (
    <div
      className={`toast-item flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg transition-all duration-300 ${
        visible && !exiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
      }`}
    >
      <Icon size={15} className={`shrink-0 ${style.iconColor}`} />
      <span>{toast.message}</span>
    </div>
  );
};

const Toast = () => {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 sm:top-6 right-4 sm:right-6 z-[2000] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
};

export default Toast;

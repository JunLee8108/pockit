import { useState } from "react";
import { X } from "lucide-react";
import useDashboardAlerts from "../../hooks/useDashboardAlerts";
import CategoryIcon from "../../components/CategoryIcon";

const TODAY_STR = new Date().toISOString().split("T")[0];
const DISMISS_KEY = "pockit_alerts_dismissed";

const DashboardAlerts = ({ fmt }) => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === TODAY_STR,
  );

  const alerts = useDashboardAlerts(fmt);

  if (dismissed || alerts.length === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, TODAY_STR);
    setDismissed(true);
  };

  return (
    <div className="dash-card bg-surface shadow-sm rounded-2xl px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-sub font-medium">
          알림 {alerts.length}건
        </span>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
        >
          <X size={14} />
        </button>
      </div>

      {/* Alert List */}
      {alerts.map((alert, i) => (
        <div
          key={alert.id}
          className={`flex items-center gap-2 py-2 ${
            i < alerts.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <CategoryIcon
            name={alert.icon}
            size={13}
            style={{ color: alert.iconColor }}
          />
          <span className="text-[12px] text-text truncate flex-1">
            {alert.label}
          </span>
          <span className="text-[12px] font-medium text-text shrink-0">
            {alert.detailFormatted}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${alert.typeBg} ${alert.typeColor} shrink-0`}
          >
            {alert.type}
          </span>
          <span
            className={`text-[11px] font-medium shrink-0 ${alert.badgeColor}`}
          >
            {alert.badge}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DashboardAlerts;

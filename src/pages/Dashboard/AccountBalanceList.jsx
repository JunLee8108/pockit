import { Link } from "react-router";
import { Landmark } from "lucide-react";
import { formatMoney } from "../../utils/format";
import { ACCOUNT_ICON_MAP } from "../../utils/constants";

const AccountBalanceList = ({ accounts, getCurrencyByCode }) => {
  if (accounts.length === 0) {
    return (
      <div className="dash-card bg-surface rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg bg-sky/15 flex items-center justify-center">
            <Landmark size={14} className="text-sky" />
          </span>
          <h3 className="text-[13px] text-sub font-medium tracking-wide">
            계좌 잔액
          </h3>
        </div>
        <p className="text-[13px] text-sub mb-2">등록된 계좌가 없습니다</p>
        <Link
          to="/accounts"
          className="text-mint text-[13px] font-medium no-underline"
        >
          계좌 추가하기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="dash-card bg-surface rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-sky/15 flex items-center justify-center">
            <Landmark size={14} className="text-sky" />
          </span>
          <h3 className="text-[13px] text-sub font-medium tracking-wide">
            계좌 잔액
          </h3>
        </div>
        <Link
          to="/accounts"
          className="text-mint text-[12px] font-medium no-underline"
        >
          관리 →
        </Link>
      </div>

      <div className="flex flex-col">
        {accounts.map((a) => {
          const Icon = ACCOUNT_ICON_MAP[a.icon];
          const cur = getCurrencyByCode(a.currency);
          const neg = a.balance < 0;
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 py-3 border-b border-border last:border-b-0"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: a.color + "18" }}
              >
                {Icon ? (
                  <Icon size={16} style={{ color: a.color }} />
                ) : (
                  <Landmark size={16} style={{ color: a.color }} />
                )}
              </div>
              <span className="text-[14px] text-text truncate flex-1">
                {a.name}
              </span>
              <span
                className={`text-[14px] font-semibold shrink-0 ${neg ? "text-coral" : "text-text"}`}
              >
                {formatMoney(a.balance, cur)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountBalanceList;

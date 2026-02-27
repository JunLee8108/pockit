import { Link } from "react-router";
import { Landmark } from "lucide-react";
import { formatMoney } from "../../utils/format";
import { ACCOUNT_ICON_MAP } from "../../utils/constants";

const AccountBalanceList = ({ accounts, getCurrencyByCode }) => {
  if (accounts.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-3">계좌 잔액</h3>
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
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] text-sub font-medium">계좌 잔액</h3>
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
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: a.color + "20" }}
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

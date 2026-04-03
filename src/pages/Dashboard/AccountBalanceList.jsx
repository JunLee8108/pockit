import { useMemo } from "react";
import { Link } from "react-router";
import { Landmark } from "lucide-react";
import { formatMoney } from "../../utils/format";
import {
  ACCOUNT_ICON_MAP,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_ORDER,
} from "../../utils/constants";

const DistributionBar = ({ assets, debt, fmtAssets, fmtDebt }) => {
  const total = assets + debt;
  if (total === 0) return null;
  const assetPct = (assets / total) * 100;

  return (
    <div className="mb-5">
      <div className="h-2.5 bg-light rounded-full overflow-hidden flex">
        <div
          className="h-full bg-mint rounded-full"
          style={{ width: `${assetPct}%` }}
        />
        {debt > 0 && (
          <div
            className="h-full bg-coral rounded-full"
            style={{ width: `${100 - assetPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1.5 text-[11px]">
        <span className="text-sub">
          자산 <span className="text-text font-medium">{fmtAssets}</span>
        </span>
        {debt > 0 && (
          <span className="text-sub">
            부채 <span className="text-coral font-medium">{fmtDebt}</span>
          </span>
        )}
      </div>
    </div>
  );
};

const AccountBalanceList = ({ accounts, getCurrencyByCode }) => {
  const grouped = useMemo(() => {
    const groups = [];
    ACCOUNT_TYPE_ORDER.forEach((type) => {
      const items = accounts
        .filter((a) => a.account_type === type)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
      if (items.length > 0) {
        groups.push({ type, label: ACCOUNT_TYPE_LABELS[type] || type, items });
      }
    });
    return groups;
  }, [accounts]);

  const { totalAssets, totalDebt } = useMemo(() => {
    let assets = 0;
    let debt = 0;
    accounts.forEach((a) => {
      if (a.balance >= 0) assets += a.balance;
      else debt += Math.abs(a.balance);
    });
    return { totalAssets: assets, totalDebt: debt };
  }, [accounts]);

  const primaryCurrency = useMemo(() => {
    if (accounts.length === 0) return null;
    const freq = {};
    accounts.forEach((a) => {
      freq[a.currency] = (freq[a.currency] || 0) + 1;
    });
    const code = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    return getCurrencyByCode(code);
  }, [accounts, getCurrencyByCode]);

  const fmtAmount = (amount) => formatMoney(amount, primaryCurrency);

  if (accounts.length === 0) {
    return (
      <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
        <h3 className="text-[13px] text-sub font-medium tracking-wide mb-3">
          계좌 잔액
        </h3>
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
    <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] text-sub font-medium tracking-wide">
          계좌 잔액
        </h3>
        <Link
          to="/accounts"
          className="text-mint text-[12px] font-medium no-underline"
        >
          관리 →
        </Link>
      </div>

      {/* Distribution Bar */}
      <DistributionBar
        assets={totalAssets}
        debt={totalDebt}
        fmtAssets={fmtAmount(totalAssets)}
        fmtDebt={fmtAmount(totalDebt)}
      />

      {grouped.map((group, gi) => (
        <div key={group.type} className={gi > 0 ? "mt-4" : ""}>
          <div className="text-[11px] text-sub font-medium mb-1 tracking-wide">
            {group.label}
          </div>
          {group.items.map((a, ai) => {
            const Icon = ACCOUNT_ICON_MAP[a.icon];
            const cur = getCurrencyByCode(a.currency);
            const neg = a.balance < 0;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 py-3 ${
                  ai < group.items.length - 1
                    ? "border-b border-border"
                    : ""
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: a.color + "18" }}
                >
                  {Icon ? (
                    <Icon size={14} style={{ color: a.color }} />
                  ) : (
                    <Landmark size={14} style={{ color: a.color }} />
                  )}
                </div>
                <span className="text-[13px] text-text truncate flex-1">
                  {a.name}
                </span>
                <span
                  className={`text-[13px] font-semibold shrink-0 ${neg ? "text-coral" : "text-text"}`}
                >
                  {formatMoney(a.balance, cur)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default AccountBalanceList;

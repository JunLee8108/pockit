import { useState, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAccounts, useDeleteAccount } from "../../hooks/useAccounts";
import { useCurrencies } from "../../hooks/useCurrencies";
import { formatMoney } from "../../utils/format";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ORDER } from "../../utils/constants";
import useUIStore from "../../store/useUIStore";
import AccountCard from "./AccountCard";
import AccountForm from "./AccountForm";
import AccountsSkeleton from "./AccountSkeleton";
import SwipeableCard from "./SwipeableCard";

const Accounts = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: currencies = [] } = useCurrencies();
  const deleteAccount = useDeleteAccount();
  const [openCardId, setOpenCardId] = useState(null);

  const {
    accountFormOpen,
    accountEditTarget,
    openAccountForm,
    closeAccountForm,
  } = useUIStore();

  const getCurrencyByCode = useCallback(
    (code) => currencies.find((c) => c.code === code) ?? null,
    [currencies],
  );

  const handleEdit = useCallback(
    (account) => openAccountForm(account),
    [openAccountForm],
  );

  const handleDelete = useCallback(
    async (account) => {
      if (window.confirm(`"${account.name}" 계좌를 삭제하시겠습니까?`)) {
        deleteAccount.mutate(account.id);
      }
    },
    [deleteAccount],
  );

  // 통화별 총 자산 계산
  const totalsByCurrency = useMemo(() => {
    const result = {};
    accounts.forEach((a) => {
      if (!result[a.currency])
        result[a.currency] = { assets: 0, liabilities: 0 };
      if (a.balance >= 0) result[a.currency].assets += a.balance;
      else result[a.currency].liabilities += a.balance;
    });
    return result;
  }, [accounts]);

  // account_type별 그룹핑
  const grouped = useMemo(() => {
    const result = {};
    accounts.forEach((a) => {
      const type = a.account_type;
      if (!result[type]) result[type] = [];
      result[type].push(a);
    });
    return result;
  }, [accounts]);

  // 빠른 통계
  const stats = useMemo(() => {
    const currencyCodes = [...new Set(accounts.map((a) => a.currency))];
    const totalAssets = Object.values(totalsByCurrency).reduce(
      (s, t) => s + t.assets,
      0,
    );
    const totalLiabilities = Object.values(totalsByCurrency).reduce(
      (s, t) => s + t.liabilities,
      0,
    );
    return {
      count: accounts.length,
      currencyCount: currencyCodes.length,
      currencyCodes,
      hasLiabilities: totalLiabilities < 0,
      totalAssets,
      totalLiabilities,
    };
  }, [accounts, totalsByCurrency]);

  if (isLoading) return <AccountsSkeleton />;

  return (
    <div className="flex flex-col gap-6" onClick={() => setOpenCardId(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">계좌 관리</h2>
        <button
          onClick={() => openAccountForm()}
          className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
        >
          <Plus size={16} />
          계좌 추가
        </button>
      </div>

      {/* 2-Column Layout (desktop) / 1-Column (mobile, tablet) */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── 좌측: 요약 패널 ── */}
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            {/* 순자산 요약 */}
            {Object.keys(totalsByCurrency).length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-[13px] text-sub font-medium mb-4">
                  총 자산 요약
                </h3>
                <div className="flex flex-col gap-4">
                  {Object.entries(totalsByCurrency).map(([code, totals]) => {
                    const cur = getCurrencyByCode(code);
                    const net = totals.assets + totals.liabilities;
                    return (
                      <div key={code}>
                        <div className="text-[12px] text-sub mb-1">
                          순자산 ({code})
                        </div>
                        <div
                          className={`text-[22px] font-bold ${net < 0 ? "text-coral" : "text-text"}`}
                        >
                          {formatMoney(net, cur)}
                        </div>
                        {totals.liabilities < 0 && (
                          <div className="text-[12px] text-coral mt-1">
                            부채: {formatMoney(totals.liabilities, cur)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 빠른 통계 */}
            {accounts.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-[13px] text-sub font-medium mb-3">
                  빠른 통계
                </h3>
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-sub">총 계좌</span>
                    <span className="text-text font-medium">
                      {stats.count}개
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-sub">통화</span>
                    <span className="text-text font-medium">
                      {stats.currencyCount}종 ({stats.currencyCodes.join(", ")})
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-sub">부채</span>
                    <span
                      className={`font-medium ${stats.hasLiabilities ? "text-coral" : "text-text"}`}
                    >
                      {stats.hasLiabilities ? "있음" : "없음"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 우측: 계좌 목록 ── */}
        <div className="flex-1 min-w-0">
          {/* Empty */}
          {accounts.length === 0 && (
            <div className="bg-surface border border-border rounded-xl p-10 text-center">
              <p className="text-sub text-sm mb-3">등록된 계좌가 없습니다</p>
              <button
                onClick={() => openAccountForm()}
                className="text-mint text-sm font-medium cursor-pointer bg-transparent border-none"
              >
                첫 계좌를 추가해보세요 →
              </button>
            </div>
          )}

          {/* 타입별 그룹 */}
          <div className="flex flex-col gap-5">
            {ACCOUNT_TYPE_ORDER.map((type) => {
              const items = grouped[type];
              if (!items || items.length === 0) return null;

              return (
                <div key={type}>
                  <h3 className="text-[13px] text-sub font-medium mb-3">
                    {ACCOUNT_TYPE_LABELS[type]}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {items.map((account) => (
                      <SwipeableCard
                        key={account.id}
                        cardId={account.id}
                        openCardId={openCardId}
                        onOpenChange={setOpenCardId}
                        actions={[
                          {
                            key: "edit",
                            label: "수정",
                            icon: <Pencil size={18} />,
                            className: "bg-mint",
                            onClick: () => handleEdit(account),
                          },
                          {
                            key: "delete",
                            label: "삭제",
                            icon: <Trash2 size={18} />,
                            className: "bg-coral",
                            onClick: () => handleDelete(account),
                          },
                        ]}
                      >
                        <AccountCard
                          account={account}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </SwipeableCard>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <AccountForm
        open={accountFormOpen}
        onClose={closeAccountForm}
        editAccount={accountEditTarget}
      />
    </div>
  );
};

export default Accounts;

import { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  Check,
  Clock,
  PlayCircle,
} from "lucide-react";
import {
  useFixedExpenses,
  useDeleteFixedExpense,
  useToggleFixedExpense,
} from "../../hooks/useFixedExpenses";
import { useBulkCreateFixedExpenseTx } from "../../hooks/useFixedExpenseSync";
import { useTransactions } from "../../hooks/useTransactions";
import { useCurrencies } from "../../hooks/useCurrencies";
import { formatMoney } from "../../utils/format";
import CategoryIcon from "../../components/CategoryIcon";
import SwipeableCard from "../Accounts/SwipeableCard";
import FixedExpenseForm from "./FixedExpenseForm";
import useConfirm from "../../hooks/useConfirm";

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

const FixedExpenses = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [openCardId, setOpenCardId] = useState(null);
  const confirm = useConfirm();

  const { data: fixedExpenses = [], isLoading } = useFixedExpenses();
  const { data: monthTxs = [] } = useTransactions({ year: YEAR, month: MONTH });
  const { data: currencies = [] } = useCurrencies();
  const deleteMutation = useDeleteFixedExpense();
  const toggleMutation = useToggleFixedExpense();
  const bulkCreate = useBulkCreateFixedExpenseTx();

  // 이번 달 이미 생성된 고정지출 transaction ID 목록
  const registeredIds = useMemo(() => {
    const set = new Set();
    monthTxs.forEach((tx) => {
      if (tx.fixed_expense_id) set.add(tx.fixed_expense_id);
    });
    return set;
  }, [monthTxs]);

  const primaryCurrency = useMemo(() => {
    if (fixedExpenses.length > 0) {
      const freq = {};
      fixedExpenses.forEach((fe) => {
        freq[fe.currency] = (freq[fe.currency] || 0) + 1;
      });
      const code = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
      return currencies.find((c) => c.code === code);
    }
    return currencies.find((c) => c.code === "USD");
  }, [fixedExpenses, currencies]);

  const fmt = useCallback(
    (amount) => formatMoney(amount, primaryCurrency),
    [primaryCurrency],
  );

  const activeExpenses = useMemo(
    () => fixedExpenses.filter((fe) => fe.is_active),
    [fixedExpenses],
  );

  const inactiveExpenses = useMemo(
    () => fixedExpenses.filter((fe) => !fe.is_active),
    [fixedExpenses],
  );

  const summary = useMemo(() => {
    const total = activeExpenses.reduce((s, fe) => s + fe.amount, 0);
    const registeredCount = activeExpenses.filter((fe) =>
      registeredIds.has(fe.id),
    ).length;
    return { total, count: activeExpenses.length, registeredCount };
  }, [activeExpenses, registeredIds]);

  const unregisteredCount = summary.count - summary.registeredCount;

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = useCallback((fe) => {
    setEditTarget(fe);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (fe) => {
      const ok = await confirm({
        title: "고정지출 삭제",
        message: `"${fe.name}"을(를) 삭제하시겠습니까?`,
        confirmText: "삭제",
        variant: "danger",
      });
      if (ok) deleteMutation.mutate(fe.id);
    },
    [deleteMutation, confirm],
  );

  const handleToggle = useCallback(
    (fe) => {
      toggleMutation.mutate({ id: fe.id, is_active: !fe.is_active });
    },
    [toggleMutation],
  );

  const handleBulkCreate = useCallback(async () => {
    if (unregisteredCount === 0) {
      await confirm({
        title: "알림",
        message: "이번 달 모든 고정지출이 이미 등록되었습니다.",
        confirmText: "확인",
        cancelText: "",
        variant: "info",
      });
      return;
    }

    const ok = await confirm({
      title: "이번 달 일괄 등록",
      message: `미등록 고정지출 ${unregisteredCount}건을 거래내역에 등록하시겠습니까?\n계좌 잔액이 자동으로 차감됩니다.`,
      confirmText: "등록",
      variant: "info",
    });
    if (!ok) return;

    try {
      await bulkCreate.mutateAsync(fixedExpenses);
    } catch (err) {
      await confirm({
        title: "오류",
        message: err.message || "등록 중 오류가 발생했습니다",
        confirmText: "확인",
        cancelText: "",
        variant: "danger",
      });
    }
  }, [unregisteredCount, fixedExpenses, bulkCreate, confirm]);

  const renderCard = (fe) => {
    const cat = fe.category;
    const isRegistered = registeredIds.has(fe.id);

    return (
      <SwipeableCard
        key={fe.id}
        cardId={fe.id}
        openCardId={openCardId}
        onOpenChange={setOpenCardId}
        actions={[
          {
            key: "edit",
            label: "수정",
            icon: <Pencil size={18} />,
            className: "bg-mint",
            onClick: () => handleEdit(fe),
          },
          {
            key: "delete",
            label: "삭제",
            icon: <Trash2 size={18} />,
            className: "bg-coral",
            onClick: () => handleDelete(fe),
          },
        ]}
      >
        <div className="bg-surface border border-border rounded-xl p-4 group">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: (cat?.color || "#94a3b8") + "18",
              }}
            >
              <CategoryIcon
                name={cat?.icon}
                size={18}
                style={{ color: cat?.color || "#94a3b8" }}
              />
            </div>

            {/* Name + Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-text truncate">
                  {fe.name}
                </span>
                {!fe.is_active && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-light text-sub">
                    비활성
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[12px] text-sub">
                  {cat?.name || "미분류"}
                </span>
                <span className="text-[12px] text-sub">·</span>
                <span className="text-[12px] text-sub">매월 {fe.billing_day}일</span>
                {fe.account && (
                  <>
                    <span className="text-[12px] text-sub">·</span>
                    <span className="text-[12px] text-sub truncate">
                      {fe.account.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Amount + Status */}
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <span className="text-[14px] font-semibold text-text">
                {fmt(fe.amount)}
              </span>
              {fe.is_active && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                    isRegistered
                      ? "bg-mint-bg text-mint"
                      : "bg-light text-sub"
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <Check size={10} />
                      등록됨
                    </>
                  ) : (
                    <>
                      <Clock size={10} />
                      대기
                    </>
                  )}
                </span>
              )}
            </div>

            {/* Hover Actions (Desktop) */}
            <div className="hover-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(fe);
                }}
                className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none text-[11px]"
                title={fe.is_active ? "비활성화" : "활성화"}
              >
                {fe.is_active ? "OFF" : "ON"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(fe);
                }}
                className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(fe);
                }}
                className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </SwipeableCard>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="skeleton" style={{ width: 120, height: 24 }} />
          <div className="skeleton" style={{ width: 100, height: 36 }} />
        </div>
        <div className="skeleton" style={{ width: "100%", height: 120 }} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ width: "100%", height: 72 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">고정지출</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
        >
          <Plus size={16} />
          추가
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Summary Sidebar */}
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            {/* Monthly Summary Card */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock size={16} className="text-mint" />
                <h3 className="text-[13px] text-sub font-medium">
                  {MONTH}월 고정지출 요약
                </h3>
              </div>

              {activeExpenses.length === 0 ? (
                <p className="text-[13px] text-sub">
                  등록된 고정지출이 없습니다
                </p>
              ) : (
                <>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-[22px] font-bold text-text">
                      {fmt(summary.total)}
                    </span>
                    <span className="text-[13px] text-sub mb-0.5">
                      / 월
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-sub">활성 항목</span>
                      <span className="text-text font-medium">
                        {summary.count}건
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-sub">이번 달 등록</span>
                      <span className="text-mint font-medium">
                        {summary.registeredCount}건
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-sub">미등록</span>
                      <span
                        className={`font-medium ${unregisteredCount > 0 ? "text-amber" : "text-sub"}`}
                      >
                        {unregisteredCount}건
                      </span>
                    </div>
                  </div>

                  {/* Bulk Create Button */}
                  <button
                    onClick={handleBulkCreate}
                    disabled={bulkCreate.isPending}
                    className={`w-full mt-4 py-2.5 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      unregisteredCount > 0
                        ? "bg-mint text-white hover:bg-mint-hover"
                        : "bg-light text-sub cursor-default"
                    } ${bulkCreate.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <PlayCircle size={14} />
                    {bulkCreate.isPending
                      ? "등록 중..."
                      : unregisteredCount > 0
                        ? `미등록 ${unregisteredCount}건 일괄 등록`
                        : "모두 등록 완료"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 min-w-0">
          {fixedExpenses.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-10 text-center">
              <p className="text-sub text-sm mb-3">
                등록된 고정지출이 없습니다
              </p>
              <button
                onClick={handleAdd}
                className="text-mint text-sm font-medium cursor-pointer bg-transparent border-none"
              >
                첫 고정지출을 추가해보세요 →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3" onClick={() => setOpenCardId(null)}>
              {/* Active */}
              {activeExpenses.map(renderCard)}

              {/* Inactive */}
              {inactiveExpenses.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-1">
                    <span className="text-[13px] text-sub font-medium">
                      비활성 항목
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {inactiveExpenses.map(renderCard)}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <FixedExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        editTarget={editTarget}
      />
    </div>
  );
};

export default FixedExpenses;

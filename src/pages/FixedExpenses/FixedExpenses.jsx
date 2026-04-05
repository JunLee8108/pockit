import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  Check,
  Clock,
  PlayCircle,
  Bell,
  Send,
} from "lucide-react";
import {
  useFixedExpenses,
  useDeleteFixedExpense,
  useToggleFixedExpense,
} from "../../hooks/useFixedExpenses";
import {
  useBulkCreateFixedExpenseTx,
  useCreateSingleFixedExpenseTx,
} from "../../hooks/useFixedExpenseSync";
import { useTransactions } from "../../hooks/useTransactions";
import { useCurrencies } from "../../hooks/useCurrencies";
import { formatMoney, toMinorUnit, toDisplayValue } from "../../utils/format";
import CategoryIcon from "../../components/CategoryIcon";
import SwipeableCard from "../Accounts/SwipeableCard";
import FixedExpenseForm from "./FixedExpenseForm";
import useConfirm from "../../hooks/useConfirm";

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

const VariableAmountInput = ({ fe, currency, onSubmit, isPending }) => {
  const decimalPlaces = currency?.decimal_places ?? 2;
  const [amount, setAmount] = useState(
    toDisplayValue(fe.amount, decimalPlaces),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const val = Number(amount);
    if (!val || val <= 0) return;
    const minor = toMinorUnit(amount, decimalPlaces);
    onSubmit(fe, minor);
  };

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 mt-2 pt-2 border-t border-border"
    >
      <span className="text-[12px] text-sub shrink-0">
        {currency?.symbol || "$"}
      </span>
      <input
        type="number"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="flex-1 min-w-0 px-2.5 py-1.5 bg-bg border border-border rounded-lg text-[13px] text-text outline-none focus:border-mint"
        placeholder="실제 금액"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1 px-3 py-1.5 bg-mint text-white rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-mint-hover transition-colors disabled:opacity-50 shrink-0"
      >
        <Send size={12} />
        등록
      </button>
    </form>
  );
};

const FixedExpenses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [openCardId, setOpenCardId] = useState(null);
  const [categoryIds, setCategoryIds] = useState([]);
  const confirm = useConfirm();

  const { data: fixedExpenses = [], isLoading } = useFixedExpenses();

  const highlightedRef = useRef(false);
  useEffect(() => {
    if (!highlightId || highlightedRef.current) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`fe-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              el.classList.add("highlight-pulse");
              setTimeout(() => el.classList.remove("highlight-pulse"), 2000);
              observer.disconnect();
            }
          },
          { threshold: 0.5 },
        );
        observer.observe(el);
      }
      highlightedRef.current = true;
      setSearchParams({}, { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [highlightId, setSearchParams]);
  const { data: monthTxs = [] } = useTransactions({ year: YEAR, month: MONTH });
  const { data: currencies = [] } = useCurrencies();
  const deleteMutation = useDeleteFixedExpense();
  const toggleMutation = useToggleFixedExpense();
  const bulkCreate = useBulkCreateFixedExpenseTx();
  const singleCreate = useCreateSingleFixedExpenseTx();

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

  const getCurrency = useCallback(
    (code) => currencies.find((c) => c.code === code) || primaryCurrency,
    [currencies, primaryCurrency],
  );

  const activeExpenses = useMemo(
    () => fixedExpenses.filter((fe) => fe.is_active),
    [fixedExpenses],
  );

  const inactiveExpenses = useMemo(
    () => fixedExpenses.filter((fe) => !fe.is_active),
    [fixedExpenses],
  );

  // 카테고리 필터용 — 고정지출에 사용된 카테고리만
  const usedCategories = useMemo(() => {
    const map = {};
    fixedExpenses.forEach((fe) => {
      const cat = fe.category;
      if (cat && !map[cat.id]) {
        map[cat.id] = cat;
      }
    });
    return Object.values(map).sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
  }, [fixedExpenses]);

  const handleCategoryToggle = useCallback((id) => {
    if (id === null) {
      setCategoryIds([]);
      return;
    }
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }, []);

  // 필터 적용된 리스트
  const filteredActive = useMemo(() => {
    if (categoryIds.length === 0) return activeExpenses;
    const set = new Set(categoryIds);
    return activeExpenses.filter((fe) => set.has(fe.category_id));
  }, [activeExpenses, categoryIds]);

  const filteredInactive = useMemo(() => {
    if (categoryIds.length === 0) return inactiveExpenses;
    const set = new Set(categoryIds);
    return inactiveExpenses.filter((fe) => set.has(fe.category_id));
  }, [inactiveExpenses, categoryIds]);

  // 일괄 등록 대상: 고정 금액 + 활성 + 미등록
  const bulkUnregisteredCount = useMemo(
    () =>
      activeExpenses.filter(
        (fe) => !fe.is_variable && !registeredIds.has(fe.id),
      ).length,
    [activeExpenses, registeredIds],
  );

  const summary = useMemo(() => {
    const total = filteredActive.reduce((s, fe) => s + fe.amount, 0);
    const registeredCount = filteredActive.filter((fe) =>
      registeredIds.has(fe.id),
    ).length;
    const variableNeedAction = filteredActive.filter(
      (fe) => fe.is_variable && !registeredIds.has(fe.id),
    ).length;
    return {
      total,
      count: filteredActive.length,
      registeredCount,
      variableNeedAction,
    };
  }, [filteredActive, registeredIds]);

  const totalUnregistered = summary.count - summary.registeredCount;

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
    if (bulkUnregisteredCount === 0) {
      await confirm({
        title: "알림",
        message:
          "고정 금액 항목이 모두 등록되었습니다.\n변동 금액 항목은 개별 등록해주세요.",
        confirmText: "확인",
        cancelText: "",
        variant: "info",
      });
      return;
    }

    const ok = await confirm({
      title: "이번 달 일괄 등록",
      message: `고정 금액 미등록 ${bulkUnregisteredCount}건을 거래내역에 등록하시겠습니까?\n계좌 잔액이 자동으로 차감됩니다.\n(변동 금액 항목은 개별 등록해주세요)`,
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
  }, [bulkUnregisteredCount, fixedExpenses, bulkCreate, confirm]);

  const handleSingleCreate = useCallback(
    (fe, actualAmount) => {
      singleCreate.mutate({ fixedExpense: fe, actualAmount });
    },
    [singleCreate],
  );

  const renderCard = (fe) => {
    const cat = fe.category;
    const isRegistered = registeredIds.has(fe.id);
    const feCurrency = getCurrency(fe.currency);

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
        <div id={`fe-${fe.id}`} className="dash-card bg-surface shadow-sm rounded-xl p-4 group">
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
                {fe.is_variable && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/15 text-amber font-medium">
                    변동
                  </span>
                )}
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
                <span className="text-[12px] text-sub">
                  매월 {fe.billing_day}일
                </span>
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
                {fe.is_variable ? `~${fmt(fe.amount)}` : fmt(fe.amount)}
              </span>
              {fe.is_active && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                    isRegistered
                      ? "bg-mint-bg text-mint"
                      : fe.is_variable
                        ? "bg-amber/15 text-amber"
                        : "bg-light text-sub"
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <Check size={10} />
                      등록됨
                    </>
                  ) : fe.is_variable ? (
                    <>
                      <Bell size={10} />
                      확인 필요
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

          {/* Variable Amount Inline Input */}
          {fe.is_active && fe.is_variable && !isRegistered && (
            <VariableAmountInput
              fe={fe}
              currency={feCurrency}
              onSubmit={handleSingleCreate}
              isPending={singleCreate.isPending}
            />
          )}
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

      {/* Category Filter Chips */}
      {usedCategories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCategoryToggle(null)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border-none cursor-pointer transition-colors ${
              categoryIds.length === 0
                ? "bg-text text-surface"
                : "bg-light text-sub hover:bg-border"
            }`}
          >
            전체
          </button>
          {usedCategories.map((cat) => {
            const selected = categoryIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border-none cursor-pointer transition-colors ${
                  selected
                    ? ""
                    : "bg-light text-sub hover:bg-border"
                }`}
                style={selected ? { backgroundColor: cat.color } : undefined}
              >
                <CategoryIcon
                  name={cat.icon}
                  size={12}
                  style={{ color: selected ? "rgba(0,0,0,0.7)" : cat.color }}
                />
                <span style={selected ? { color: "rgba(0,0,0,0.75)" } : undefined}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Summary Sidebar */}
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            {/* Monthly Summary Card */}
            <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
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
                    <span className="text-[13px] text-sub mb-0.5">/ 월</span>
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
                        className={`font-medium ${totalUnregistered > 0 ? "text-amber" : "text-sub"}`}
                      >
                        {totalUnregistered}건
                      </span>
                    </div>
                    {summary.variableNeedAction > 0 && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-sub">확인 필요 (변동)</span>
                        <span className="text-amber font-medium">
                          {summary.variableNeedAction}건
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bulk Create Button */}
                  <button
                    onClick={handleBulkCreate}
                    disabled={bulkCreate.isPending}
                    className={`w-full mt-4 py-2.5 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      bulkUnregisteredCount > 0
                        ? "bg-mint text-white hover:bg-mint-hover"
                        : "bg-light text-sub cursor-default"
                    } ${bulkCreate.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <PlayCircle size={14} />
                    {bulkCreate.isPending
                      ? "등록 중..."
                      : bulkUnregisteredCount > 0
                        ? `고정 금액 ${bulkUnregisteredCount}건 일괄 등록`
                        : "고정 금액 모두 등록 완료"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 min-w-0">
          {fixedExpenses.length === 0 ? (
            <div className="dash-card bg-surface shadow-sm rounded-2xl p-10 text-center">
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
            <div
              className="flex flex-col gap-3"
              onClick={() => setOpenCardId(null)}
            >
              {/* Active */}
              {filteredActive.map(renderCard)}

              {/* Inactive */}
              {filteredInactive.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-1">
                    <span className="text-[13px] text-sub font-medium">
                      비활성 항목
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {filteredInactive.map(renderCard)}
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

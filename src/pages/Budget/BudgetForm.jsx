import { useState } from "react";
import { X } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useAddBudget, useUpdateBudget } from "../../hooks/useBudgets";
import { toMinorUnit, toDisplayValue } from "../../utils/format";
import CategorySelect from "../../components/CategorySelect";

const inputCls =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const BudgetFormInner = ({
  onClose,
  editBudget = null,
  year,
  month,
  existingCategoryIds,
}) => {
  const { data: categories = [] } = useCategories();
  const { data: currencies = [] } = useCurrencies();
  const addBudget = useAddBudget();
  const updateBudget = useUpdateBudget();

  const isEdit = !!editBudget;

  const expenseCategories = categories.filter((c) => c.type === "expense");

  // 수정 시 기존 값, 신규 시 빈 값
  const editCurrency = editBudget
    ? currencies.find((c) => c.code === editBudget.currency)
    : null;

  const [categoryId, setCategoryId] = useState(editBudget?.category_id || "");
  const [amountDisplay, setAmountDisplay] = useState(
    editBudget
      ? toDisplayValue(editBudget.amount, editCurrency?.decimal_places ?? 2)
      : "",
  );
  const [currency, setCurrency] = useState(editBudget?.currency || "USD");
  const [error, setError] = useState("");

  const selectedCurrency = currencies.find((c) => c.code === currency);
  const submitting = addBudget.isPending || updateBudget.isPending;

  // 이미 예산이 설정된 카테고리는 선택지에서 제외 (수정 시 본인은 허용)
  const availableCategories = isEdit
    ? expenseCategories
    : expenseCategories.filter((c) => !existingCategoryIds.has(c.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!categoryId) {
      setError("카테고리를 선택하세요");
      return;
    }
    if (!amountDisplay || Number(amountDisplay) <= 0) {
      setError("예산 금액을 입력하세요");
      return;
    }

    const amount = toMinorUnit(
      amountDisplay,
      selectedCurrency?.decimal_places ?? 2,
    );

    try {
      if (isEdit) {
        await updateBudget.mutateAsync({
          id: editBudget.id,
          updates: { amount, currency },
        });
      } else {
        await addBudget.mutateAsync({
          category_id: categoryId,
          amount,
          currency,
          year,
          month,
        });
      }
      onClose();
    } catch (err) {
      if (err.message?.includes("duplicate") || err.code === "23505") {
        setError("이 카테고리에 이미 예산이 설정되어 있습니다");
      } else {
        setError(err.message || "오류가 발생했습니다");
      }
    }
  };

  return (
    <>
      {error && (
        <div className="px-4 py-3 bg-error-bg rounded-lg text-[13px] text-error mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">카테고리 *</label>
          {isEdit ? (
            <div className="px-4 py-2.5 bg-light border border-border rounded-lg text-sm text-sub">
              {editBudget.category?.name || "미분류"}
            </div>
          ) : (
            <CategorySelect
              categories={availableCategories}
              value={categoryId}
              onChange={setCategoryId}
            />
          )}
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">통화 *</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputCls}
            disabled={isEdit}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">
            예산 금액 ({selectedCurrency?.symbol || "$"}) *
          </label>
          <input
            type="number"
            step="any"
            value={amountDisplay}
            onChange={(e) => setAmountDisplay(e.target.value)}
            placeholder="0"
            required
            className={inputCls}
          />
        </div>

        {/* Period Info */}
        <div className="px-4 py-2.5 bg-light rounded-lg text-[13px] text-sub">
          적용 기간: {year}년 {month}월
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full mt-2 py-3 rounded-lg text-[15px] font-semibold text-white border-none cursor-pointer transition-colors ${
            submitting
              ? "bg-border cursor-not-allowed"
              : "bg-mint hover:bg-mint-hover"
          }`}
        >
          {submitting
            ? isEdit
              ? "수정 중..."
              : "추가 중..."
            : isEdit
              ? "수정 완료"
              : "예산 추가"}
        </button>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const BudgetForm = ({
  open,
  onClose,
  editBudget = null,
  year,
  month,
  existingCategoryIds = new Set(),
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  if (open && !visible && !closing) {
    setVisible(true);
  }

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      onClose();
    }, ANIM_DURATION);
  };

  if (!visible) return null;

  const animating = closing;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        className={`fixed inset-0 bg-black/30 ${animating ? "animate-fadeOut" : "animate-fadeIn"}`}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative overscroll-contain bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto ${
          animating ? "animate-slideDown" : "animate-slideUp"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-semibold text-text">
            {editBudget ? "예산 수정" : "예산 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <BudgetFormInner
          key={editBudget?.id || "new"}
          onClose={handleClose}
          editBudget={editBudget}
          year={year}
          month={month}
          existingCategoryIds={existingCategoryIds}
        />
      </div>
    </div>
  );
};

export default BudgetForm;

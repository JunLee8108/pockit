import { useState } from "react";
import { X } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { useAccounts } from "../../hooks/useAccounts";
import { useCurrencies } from "../../hooks/useCurrencies";
import {
  useAddFixedExpense,
  useUpdateFixedExpense,
} from "../../hooks/useFixedExpenses";
import { toMinorUnit, toDisplayValue } from "../../utils/format";
import CategorySelect from "../../components/CategorySelect";

const inputCls =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const FixedExpenseFormInner = ({ onClose, editTarget = null }) => {
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: currencies = [] } = useCurrencies();
  const addMutation = useAddFixedExpense();
  const updateMutation = useUpdateFixedExpense();

  const isEdit = !!editTarget;
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const editCurrency = editTarget
    ? currencies.find((c) => c.code === editTarget.currency)
    : null;

  const [name, setName] = useState(editTarget?.name || "");
  const [amountDisplay, setAmountDisplay] = useState(
    editTarget
      ? toDisplayValue(editTarget.amount, editCurrency?.decimal_places ?? 2)
      : "",
  );
  const [currency, setCurrency] = useState(editTarget?.currency || "USD");
  const [categoryId, setCategoryId] = useState(editTarget?.category_id || "");
  const [accountId, setAccountId] = useState(editTarget?.account_id || "");
  const [billingDay, setBillingDay] = useState(editTarget?.billing_day || 1);
  const [isVariable, setIsVariable] = useState(editTarget?.is_variable || false);
  const [memo, setMemo] = useState(editTarget?.memo || "");
  const [error, setError] = useState("");

  const selectedCurrency = currencies.find((c) => c.code === currency);
  const submitting = addMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("지출명을 입력하세요");
      return;
    }
    if (!amountDisplay || Number(amountDisplay) <= 0) {
      setError("금액을 입력하세요");
      return;
    }
    if (!accountId) {
      setError("결제 계좌를 선택하세요");
      return;
    }

    const amount = toMinorUnit(
      amountDisplay,
      selectedCurrency?.decimal_places ?? 2,
    );

    const payload = {
      name: name.trim(),
      amount,
      currency,
      category_id: categoryId || null,
      account_id: accountId,
      billing_day: Number(billingDay),
      is_variable: isVariable,
      memo: memo.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: editTarget.id,
          updates: payload,
        });
      } else {
        await addMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || "오류가 발생했습니다");
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
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">지출명 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="넷플릭스, 월세, 통신비 등"
            required
            className={inputCls}
          />
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">통화 *</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputCls}
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
            금액 ({selectedCurrency?.symbol || "$"}) *
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

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">카테고리</label>
          <CategorySelect
            categories={expenseCategories}
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>

        {/* Account */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">
            결제 계좌 *
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={inputCls}
            required
          >
            <option value="">계좌 선택</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Billing Day */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">결제일 *</label>
          <select
            value={billingDay}
            onChange={(e) => setBillingDay(e.target.value)}
            className={inputCls}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                매월 {d}일
              </option>
            ))}
          </select>
        </div>

        {/* Variable Amount Toggle */}
        <div className="flex items-center justify-between px-1">
          <div>
            <label className="text-[13px] text-sub font-medium">
              변동 금액
            </label>
            <p className="text-[11px] text-sub mt-0.5">
              매월 금액이 다르면 켜세요 (자동 등록 안 됨)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsVariable((v) => !v)}
            className={`relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors duration-200 ${
              isVariable ? "bg-mint" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                isVariable ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Memo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">메모</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (선택)"
            className={inputCls}
          />
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
              : "고정지출 추가"}
        </button>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const FixedExpenseForm = ({ open, onClose, editTarget = null }) => {
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
            {editTarget ? "고정지출 수정" : "고정지출 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <FixedExpenseFormInner
          key={editTarget?.id || "new"}
          onClose={handleClose}
          editTarget={editTarget}
        />
      </div>
    </div>
  );
};

export default FixedExpenseForm;

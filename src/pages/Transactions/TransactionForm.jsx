import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useAccounts } from "../../hooks/useAccounts";
import {
  useCategories,
  useSeedDefaultCategories,
} from "../../hooks/useCategories";
import { useCurrencies } from "../../hooks/useCurrencies";
import {
  useAddTransaction,
  useUpdateTransaction,
} from "../../hooks/useTransactions";
import useDescriptionSuggestions from "../../hooks/useDescriptionSuggestions";
import { toMinorUnit, toDisplayValue } from "../../utils/format";
import CategorySelect from "../../components/CategorySelect";
import DescriptionAutocomplete from "../../components/DescriptionAutocomplete";

const inputCls =
  "w-full min-w-0 max-w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const TYPE_OPTIONS = [
  { value: "income", label: "수입", color: "bg-mint text-white" },
  { value: "expense", label: "지출", color: "bg-coral text-white" },
  { value: "transfer", label: "이체", color: "bg-sub text-white" },
];

const TransactionFormInner = ({ onClose, editTx = null }) => {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: currencies = [] } = useCurrencies();
  const seedCategories = useSeedDefaultCategories();
  const addTx = useAddTransaction();
  const updateTx = useUpdateTransaction();
  const suggestions = useDescriptionSuggestions();

  // editTx에 id가 있으면 수정 모드, 없으면 새 거래 (duplicate 포함)
  const isEdit = !!editTx?.id;

  const [type, setType] = useState(editTx?.type || "expense");
  const [amountDisplay, setAmountDisplay] = useState(
    editTx?.amount
      ? toDisplayValue(
          editTx.amount,
          currencies.find((c) => c.code === editTx.currency)?.decimal_places ||
            2,
        )
      : "",
  );
  const [accountId, setAccountId] = useState(
    () => editTx?.account_id || accounts[0]?.id || "",
  );
  const [toAccountId, setToAccountId] = useState(editTx?.to_account_id || "");
  const [categoryId, setCategoryId] = useState(editTx?.category_id || "");
  const [date, setDate] = useState(
    editTx?.date || new Date().toISOString().split("T")[0],
  );
  const [description, setDescription] = useState(editTx?.description || "");
  const [memo, setMemo] = useState(editTx?.memo || "");
  const [error, setError] = useState("");

  // 카테고리 없으면 시드 (1회만)
  const seededRef = useRef(false);
  useEffect(() => {
    if (categories.length === 0 && !seededRef.current) {
      seededRef.current = true;
      seedCategories.mutate();
    }
  }, [categories.length, seedCategories]);

  // 자동완성에서 선택 시 카테고리도 함께 채움
  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.categoryId) {
      setCategoryId(suggestion.categoryId);
    }
    if (suggestion.type && suggestion.type !== "transfer") {
      setType(suggestion.type);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCurrency = currencies.find(
    (c) => c.code === selectedAccount?.currency,
  );
  const submitting = addTx.isPending || updateTx.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amountDisplay || Number(amountDisplay) <= 0) {
      setError("금액을 입력하세요");
      return;
    }
    if (!accountId) {
      setError("계좌를 선택하세요");
      return;
    }
    if (type === "transfer" && !toAccountId) {
      setError("받는 계좌를 선택하세요");
      return;
    }
    if (type === "transfer" && accountId === toAccountId) {
      setError("같은 계좌로 이체할 수 없습니다");
      return;
    }

    const payload = {
      type,
      amount: toMinorUnit(amountDisplay, selectedCurrency?.decimal_places || 2),
      currency: selectedAccount?.currency || "USD",
      account_id: accountId,
      to_account_id: type === "transfer" ? toAccountId : null,
      category_id: type === "transfer" ? null : categoryId || null,
      date,
      description: description.trim(),
      memo: memo.trim() || null,
    };

    try {
      if (isEdit) {
        await updateTx.mutateAsync({
          id: editTx.id,
          updates: payload,
          prevTx: editTx,
        });
      } else {
        await addTx.mutateAsync(payload);
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
        {/* Type */}
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-colors ${
                type === opt.value ? opt.color : "bg-light text-sub"
              }`}
            >
              {opt.label}
            </button>
          ))}
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

        {/* Account */}
        <div
          className={`grid gap-3 ${type === "transfer" ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-sub font-medium">
              {type === "transfer" ? "보내는 계좌 *" : "계좌 *"}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={inputCls}
            >
              <option value="">선택</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {type === "transfer" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-sub font-medium">
                받는 계좌 *
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className={inputCls}
              >
                <option value="">선택</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Category (not for transfer) */}
        {type !== "transfer" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-sub font-medium">카테고리</label>
            <CategorySelect
              categories={filteredCategories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
        )}

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">날짜 *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputCls}
          />
        </div>

        {/* Description with Autocomplete */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">설명</label>
          <DescriptionAutocomplete
            value={description}
            onChange={setDescription}
            onSelect={handleSuggestionSelect}
            suggestions={suggestions}
            className={inputCls}
          />
        </div>

        {/* Memo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="선택사항"
            rows={2}
            className={`${inputCls} resize-none`}
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
              : "거래 추가"}
        </button>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const TransactionForm = ({ open, onClose, editTx = null }) => {
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
            {editTx?.id ? "거래 수정" : "거래 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <TransactionFormInner
          key={editTx?.id || editTx?.duplicateKey || "new"}
          onClose={handleClose}
          editTx={editTx}
        />
      </div>
    </div>
  );
};

export default TransactionForm;

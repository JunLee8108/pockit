import { useState } from "react";
import { X } from "lucide-react";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useAddAccount, useUpdateAccount } from "../../hooks/useAccounts";
import { toMinorUnit, toDisplayValue } from "../../utils/format";
import {
  ACCOUNT_ICONS,
  ACCOUNT_ICON_MAP,
  ACCOUNT_COLORS,
} from "../../utils/constants";

const inputCls =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const getInitialState = (editAccount, currencies) => {
  if (editAccount) {
    const cur = currencies?.find((c) => c.code === editAccount.currency);
    return {
      name: editAccount.name,
      institution: editAccount.institution || "",
      accountType: editAccount.account_type,
      currency: editAccount.currency,
      balanceDisplay: toDisplayValue(
        editAccount.balance,
        cur?.decimal_places || 0,
      ),
      accountNumber: editAccount.account_number || "",
      color: editAccount.color,
      icon: editAccount.icon,
      memo: editAccount.memo || "",
    };
  }
  return {
    name: "",
    institution: "",
    accountType: "checking",
    currency: "USD",
    balanceDisplay: "0",
    accountNumber: "",
    color: ACCOUNT_COLORS[0],
    icon: ACCOUNT_ICONS[0],
    memo: "",
  };
};

const AccountFormInner = ({ onClose, editAccount = null }) => {
  const { data: currencies = [] } = useCurrencies();
  const addAccount = useAddAccount();
  const updateAccount = useUpdateAccount();

  const initial = getInitialState(editAccount, currencies);
  const [name, setName] = useState(initial.name);
  const [institution, setInstitution] = useState(initial.institution);
  const [accountType, setAccountType] = useState(initial.accountType);
  const [currency, setCurrency] = useState(initial.currency);
  const [balanceDisplay, setBalanceDisplay] = useState(initial.balanceDisplay);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [color, setColor] = useState(initial.color);
  const [icon, setIcon] = useState(initial.icon);
  const [memo, setMemo] = useState(initial.memo);
  const [error, setError] = useState("");

  const isEdit = !!editAccount;
  const submitting = addAccount.isPending || updateAccount.isPending;
  const selectedCurrency = currencies.find((c) => c.code === currency);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("계좌 별칭을 입력하세요");
      return;
    }

    const payload = {
      name: name.trim(),
      institution: institution.trim(),
      account_type: accountType,
      currency,
      balance: toMinorUnit(
        balanceDisplay,
        selectedCurrency?.decimal_places || 0,
      ),
      account_number: accountNumber.trim() || null,
      color,
      icon,
      memo: memo.trim() || null,
    };

    try {
      if (isEdit) {
        await updateAccount.mutateAsync({
          id: editAccount.id,
          updates: payload,
        });
      } else {
        await addAccount.mutateAsync(payload);
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
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">
            계좌 별칭 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 신한 주거래, Chase Checking"
            required
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">금융기관</label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="예: 신한은행, Chase, Amex"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-sub font-medium">
              계좌 유형 *
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className={inputCls}
            >
              <option value="checking">입출금</option>
              <option value="savings">저축</option>
              <option value="investment">투자</option>
              <option value="credit_card">신용카드</option>
              <option value="cash">현금</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-sub font-medium">통화 *</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputCls}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">
            {isEdit ? "현재 잔액" : "초기 잔액"} (
            {selectedCurrency?.symbol || "$"}) *
          </label>
          <input
            type="number"
            step="any"
            value={balanceDisplay}
            onChange={(e) => setBalanceDisplay(e.target.value)}
            placeholder="0"
            required
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">계좌번호</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="선택사항"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">아이콘</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_ICONS.map((iconKey) => {
              const Icon = ACCOUNT_ICON_MAP[iconKey];
              if (!Icon) return null;
              return (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setIcon(iconKey)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer border transition-colors ${
                    icon === iconKey
                      ? "border-mint bg-mint-bg text-mint"
                      : "border-border bg-bg text-sub hover:bg-light"
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">색상</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((cl) => (
              <button
                key={cl}
                type="button"
                onClick={() => setColor(cl)}
                className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-all ${
                  color === cl ? "border-text scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: cl }}
              />
            ))}
          </div>
        </div>

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
              : "계좌 추가"}
        </button>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const AccountForm = ({ open, onClose, editAccount = null }) => {
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
        className={`relative bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto ${
          animating ? "animate-slideDown" : "animate-slideUp"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-semibold text-text">
            {editAccount ? "계좌 수정" : "계좌 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <AccountFormInner
          key={editAccount?.id || "new"}
          onClose={handleClose}
          editAccount={editAccount}
        />
      </div>
    </div>
  );
};

export default AccountForm;

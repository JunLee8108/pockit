import { useState } from "react";
import { X } from "lucide-react";
import {
  useAddCategoryRule,
  useUpdateCategoryRule,
  countRuleMatches,
  useApplyRuleToUncategorized,
} from "../../hooks/useCategoryRules";
import { useCategories } from "../../hooks/useCategories";
import useConfirm from "../../hooks/useConfirm";
import CategorySelect from "../../components/CategorySelect";

const inputCls =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const RuleFormInner = ({ onClose, editRule = null, nextSortOrder = 0 }) => {
  const { data: categories = [] } = useCategories();
  const addRule = useAddCategoryRule();
  const updateRule = useUpdateCategoryRule();
  const applyRule = useApplyRuleToUncategorized();
  const confirm = useConfirm();

  const isEdit = !!editRule;

  const [keyword, setKeyword] = useState(editRule?.keyword || "");
  const [categoryId, setCategoryId] = useState(editRule?.category_id || "");
  const [error, setError] = useState("");

  const submitting = addRule.isPending || updateRule.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const kw = keyword.trim();
    if (!kw) {
      setError("키워드를 입력하세요");
      return;
    }
    if (!categoryId) {
      setError("카테고리를 선택하세요");
      return;
    }

    try {
      if (isEdit) {
        await updateRule.mutateAsync({
          id: editRule.id,
          updates: { keyword: kw, category_id: categoryId },
        });
      } else {
        await addRule.mutateAsync({
          keyword: kw,
          category_id: categoryId,
          sort_order: nextSortOrder,
        });
      }
      onClose();

      // 소급 적용 제안 — 키워드와 일치하는 미분류 거래가 있으면 확인 후 적용
      const matches = await countRuleMatches(kw);
      if (matches > 0) {
        const ok = await confirm({
          title: "기존 거래에 적용",
          message: `"${kw}" 키워드와 일치하는 미분류 거래가 ${matches}건 있습니다.\n지금 카테고리를 적용할까요?`,
          confirmText: "적용",
          cancelText: "나중에",
        });
        if (ok) applyRule.mutate({ keyword: kw, categoryId });
      }
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
          <label className="text-[13px] text-sub font-medium">키워드 *</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: Starbucks, Uber, Netflix"
            required
            className={inputCls}
          />
          <p className="text-[12px] text-sub">
            거래 설명·가맹점명에 이 키워드가 포함되면 자동 분류됩니다 (대소문자
            구분 없음)
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">카테고리 *</label>
          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
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
              : "규칙 추가"}
        </button>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const RuleForm = ({ open, onClose, editRule = null, nextSortOrder = 0 }) => {
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
        className={`relative overscroll-contain bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-[440px] max-h-[90vh] overflow-y-auto ${
          animating ? "animate-slideDown" : "animate-slideUp"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-semibold text-text">
            {editRule ? "규칙 수정" : "규칙 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <RuleFormInner
          key={editRule?.id || "new"}
          onClose={handleClose}
          editRule={editRule}
          nextSortOrder={nextSortOrder}
        />
      </div>
    </div>
  );
};

export default RuleForm;

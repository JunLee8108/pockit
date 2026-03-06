import { useState } from "react";
import { X } from "lucide-react";
import { useAddCategory, useUpdateCategory } from "../../hooks/useCategories";
import CategoryIcon from "../../components/CategoryIcon";

const CATEGORY_ICONS = [
  "Utensils",
  "Coffee",
  "ShoppingCart",
  "ShoppingBag",
  "Car",
  "Bus",
  "Fuel",
  "Home",
  "Smartphone",
  "Wifi",
  "HeartPulse",
  "Pill",
  "GraduationCap",
  "BookOpen",
  "Gamepad2",
  "Dumbbell",
  "Music",
  "Film",
  "Plane",
  "MapPin",
  "Gift",
  "Baby",
  "Dog",
  "Shirt",
  "Scissors",
  "Wrench",
  "Lightbulb",
  "RotateCw",
  "CreditCard",
  "Banknote",
  "PiggyBank",
  "TrendingUp",
  "Briefcase",
  "Building2",
  "Landmark",
  "Receipt",
  "FileText",
  "Package",
  "Inbox",
  "Heart",
  "Star",
  "Zap",
];

const CATEGORY_COLORS = [
  "#f4845f",
  "#ef4444",
  "#f97316",
  "#fb923c",
  "#fcd34d",
  "#84cc16",
  "#6DD4B4",
  "#22d3ee",
  "#7dd3fc",
  "#38bdf8",
  "#6366f1",
  "#a78bfa",
  "#c084fc",
  "#f472b6",
  "#fda4af",
  "#94a3b8",
];

const inputCls =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const CategoryFormInner = ({ onClose, editCategory = null, defaultType }) => {
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();

  const isEdit = !!editCategory;

  const [name, setName] = useState(editCategory?.name || "");
  const [icon, setIcon] = useState(editCategory?.icon || CATEGORY_ICONS[0]);
  const [color, setColor] = useState(editCategory?.color || CATEGORY_COLORS[0]);
  const [type, setType] = useState(
    editCategory?.type || defaultType || "expense",
  );
  const [error, setError] = useState("");

  const submitting = addCategory.isPending || updateCategory.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("카테고리 이름을 입력하세요");
      return;
    }

    const payload = {
      name: name.trim(),
      icon,
      color,
      type,
    };

    try {
      if (isEdit) {
        await updateCategory.mutateAsync({
          id: editCategory.id,
          updates: payload,
        });
      } else {
        await addCategory.mutateAsync(payload);
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
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">유형 *</label>
          {isEdit ? (
            <div className="px-4 py-2.5 bg-light border border-border rounded-lg text-sm text-sub">
              {type === "expense" ? "지출" : "수입"}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-colors ${
                  type === "expense"
                    ? "bg-coral text-white"
                    : "bg-light text-sub"
                }`}
              >
                지출
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-colors ${
                  type === "income" ? "bg-mint text-white" : "bg-light text-sub"
                }`}
              >
                수입
              </button>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">이름 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 식비, 교통, 급여"
            required
            className={inputCls}
          />
        </div>

        {/* Icon Grid */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">아이콘</label>
          <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto p-1">
            {CATEGORY_ICONS.map((iconKey) => (
              <button
                key={iconKey}
                type="button"
                onClick={() => setIcon(iconKey)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer border transition-colors ${
                  icon === iconKey
                    ? "border-mint bg-mint-bg"
                    : "border-border bg-bg hover:bg-light"
                }`}
              >
                <CategoryIcon
                  name={iconKey}
                  size={18}
                  style={{
                    color: icon === iconKey ? color : "var(--color-sub)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">색상</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((cl) => (
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

        {/* Preview */}
        <div className="flex items-center gap-3 px-4 py-3 bg-light rounded-lg">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: color + "18" }}
          >
            <CategoryIcon name={icon} size={18} style={{ color }} />
          </div>
          <span className="text-[14px] font-medium text-text">
            {name || "미리보기"}
          </span>
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
              : "카테고리 추가"}
        </button>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const CategoryForm = ({
  open,
  onClose,
  editCategory = null,
  defaultType = "expense",
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
            {editCategory ? "카테고리 수정" : "카테고리 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <CategoryFormInner
          key={editCategory?.id || "new"}
          onClose={handleClose}
          editCategory={editCategory}
          defaultType={defaultType}
        />
      </div>
    </div>
  );
};

export default CategoryForm;

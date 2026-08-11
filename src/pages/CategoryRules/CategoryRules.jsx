import { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Wand2,
  Sparkles,
} from "lucide-react";
import {
  useCategoryRules,
  useUpdateCategoryRule,
  useDeleteCategoryRule,
  useReorderCategoryRules,
} from "../../hooks/useCategoryRules";
import {
  usePlaidCategoryMap,
  useUpdatePlaidCategoryMap,
  useDeletePlaidCategoryMap,
} from "../../hooks/usePlaidCategoryMap";
import { useCategories } from "../../hooks/useCategories";
import useConfirm from "../../hooks/useConfirm";
import CategoryIcon from "../../components/CategoryIcon";
import CategorySelect from "../../components/CategorySelect";
import RuleForm from "./RuleForm";

// Plaid 카테고리 코드 → 읽기 쉬운 형태 (FOOD_AND_DRINK_COFFEE → Food And Drink Coffee)
const humanizePlaidCategory = (code) =>
  (code || "")
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const CategoryChip = ({ category }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-light text-[13px] font-medium text-text">
    <CategoryIcon
      name={category?.icon}
      size={14}
      style={{ color: category?.color || "#94a3b8" }}
    />
    {category?.name || "삭제된 카테고리"}
  </span>
);

const Toggle = ({ on, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-9 h-5 rounded-full relative cursor-pointer border-none shrink-0 transition-colors ${
      on ? "bg-mint" : "bg-border"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
        on ? "translate-x-4" : ""
      }`}
    />
  </button>
);

const CategoryRules = () => {
  const [tab, setTab] = useState("rules");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const confirm = useConfirm();

  const { data: rules = [], isLoading: rulesLoading } = useCategoryRules();
  const { data: mappings = [], isLoading: mapLoading } = usePlaidCategoryMap();
  const { data: categories = [] } = useCategories();

  const updateRule = useUpdateCategoryRule();
  const deleteRule = useDeleteCategoryRule();
  const reorderRules = useReorderCategoryRules();
  const updateMapping = useUpdatePlaidCategoryMap();
  const deleteMapping = useDeletePlaidCategoryMap();

  const nextSortOrder = useMemo(
    () => (rules.length > 0 ? Math.max(...rules.map((r) => r.sort_order)) + 1 : 0),
    [rules],
  );

  const handleMove = useCallback(
    (index, dir) => {
      const target = index + dir;
      if (target < 0 || target >= rules.length) return;
      const next = [...rules];
      [next[index], next[target]] = [next[target], next[index]];
      reorderRules.mutate(next);
    },
    [rules, reorderRules],
  );

  const handleDeleteRule = useCallback(
    async (rule) => {
      const ok = await confirm({
        title: "규칙 삭제",
        message: `"${rule.keyword}" 규칙을 삭제하시겠습니까?\n이미 분류된 거래는 변경되지 않습니다.`,
        confirmText: "삭제",
        variant: "danger",
      });
      if (ok) deleteRule.mutate(rule.id);
    },
    [confirm, deleteRule],
  );

  const handleMappingChange = useCallback(
    async (mapping, categoryId) => {
      if (!categoryId) {
        const ok = await confirm({
          title: "매핑 삭제",
          message: `"${humanizePlaidCategory(mapping.plaid_category)}" 자동 분류를 삭제하시겠습니까?\n이후 동기화부터 이 유형은 미분류로 들어옵니다.`,
          confirmText: "삭제",
          variant: "danger",
        });
        if (ok) deleteMapping.mutate(mapping.id);
        return;
      }
      updateMapping.mutate({ id: mapping.id, categoryId });
    },
    [confirm, deleteMapping, updateMapping],
  );

  const loading = tab === "rules" ? rulesLoading : mapLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">분류 규칙</h2>
        {tab === "rules" && (
          <button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
          >
            <Plus size={16} />
            규칙 추가
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-light rounded-lg p-1 self-start">
        {[
          { value: "rules", label: "키워드 규칙", count: rules.length },
          { value: "learned", label: "자동 학습", count: mappings.length },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer border-none transition-colors ${
              tab === t.value
                ? "bg-surface text-text shadow-sm"
                : "bg-transparent text-sub hover:text-text"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-[11px] opacity-60">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
          <div className="skeleton" style={{ width: "100%", height: 120 }} />
        </div>
      ) : tab === "rules" ? (
        /* ── 키워드 규칙 ── */
        rules.length === 0 ? (
          <div className="dash-card bg-surface shadow-sm rounded-2xl p-10 text-center flex flex-col items-center gap-3">
            <Wand2 size={28} className="text-sub" />
            <p className="text-sm text-sub">
              키워드 규칙이 없습니다.
              <br />
              거래 설명에 특정 단어가 포함되면 자동으로 카테고리를 지정할 수
              있습니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-sub">
              위에 있는 규칙이 먼저 적용됩니다. 이미 분류된 거래는 변경되지
              않습니다.
            </p>
            {rules.map((rule, i) => (
              <div
                key={rule.id}
                className={`dash-card bg-surface shadow-sm rounded-xl p-4 flex items-center gap-3 ${
                  rule.is_active ? "" : "opacity-50"
                }`}
              >
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0 || reorderRules.isPending}
                    className="p-0.5 text-sub hover:text-text bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMove(i, 1)}
                    disabled={i === rules.length - 1 || reorderRules.isPending}
                    className="p-0.5 text-sub hover:text-text bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-mint-bg text-[13px] font-medium text-mint truncate max-w-[180px]">
                    {rule.keyword}
                  </span>
                  <ArrowRight size={14} className="text-sub shrink-0" />
                  <CategoryChip category={rule.category} />
                </div>

                <Toggle
                  on={rule.is_active}
                  title={rule.is_active ? "비활성화" : "활성화"}
                  onClick={() =>
                    updateRule.mutate({
                      id: rule.id,
                      updates: { is_active: !rule.is_active },
                    })
                  }
                />
                <button
                  onClick={() => {
                    setEditTarget(rule);
                    setFormOpen(true);
                  }}
                  className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none shrink-0"
                  title="수정"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule)}
                  className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none shrink-0"
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      ) : /* ── 자동 학습 (plaid_category_map) ── */
      mappings.length === 0 ? (
        <div className="dash-card bg-surface shadow-sm rounded-2xl p-10 text-center flex flex-col items-center gap-3">
          <Sparkles size={28} className="text-sub" />
          <p className="text-sm text-sub">
            학습된 분류가 없습니다.
            <br />
            은행 연동 거래의 카테고리를 바꾸면 같은 유형이 자동으로 학습됩니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-sub">
            은행 연동 거래의 카테고리를 변경할 때 자동으로 학습된 규칙입니다.
            다음 동기화부터 적용됩니다.
          </p>
          {mappings.map((m) => (
            <div
              key={m.id}
              className="dash-card bg-surface shadow-sm rounded-xl p-4 flex items-center gap-3 flex-wrap"
            >
              <div className="flex-1 min-w-[140px]">
                <div className="text-[13px] font-medium text-text truncate">
                  {humanizePlaidCategory(m.plaid_category)}
                </div>
                <div className="text-[11px] text-sub font-mono truncate">
                  {m.plaid_category}
                </div>
              </div>
              <div className="w-full sm:w-52">
                <CategorySelect
                  categories={categories}
                  value={m.category_id}
                  onChange={(categoryId) => handleMappingChange(m, categoryId)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <RuleForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        editRule={editTarget}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
};

export default CategoryRules;

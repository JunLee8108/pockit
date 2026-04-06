import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCategories, useDeleteCategory } from "../../hooks/useCategories";
import supabase from "../../lib/supabase";
import useConfirm from "../../hooks/useConfirm";
import CategoryCard from "./CategoryCard";
import CategoryForm from "./CategoryForm";
import CategoriesSkeleton from "./CategoriesSkeleton";
import SwipeableCard from "../Accounts/SwipeableCard";

const TABS = [
  { value: "expense", label: "지출" },
  { value: "income", label: "수입" },
];

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [activeTab, setActiveTab] = useState("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [openCardId, setOpenCardId] = useState(null);
  const confirm = useConfirm();

  const highlightedRef = useRef(false);
  useEffect(() => {
    if (!highlightId || highlightedRef.current || isLoading) return;
    // 하이라이트 대상 카테고리의 탭으로 전환
    const target = categories.find((c) => c.id === highlightId);
    if (target && target.type !== activeTab) {
      setActiveTab(target.type);
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(`cat-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "center" });
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
    });
  }, [highlightId, isLoading, categories, activeTab, setSearchParams]);

  const filtered = useMemo(
    () => categories.filter((c) => c.type === activeTab),
    [categories, activeTab],
  );

  // 계층 구조 — 부모 + 자식 그룹
  const hierarchyList = useMemo(() => {
    const parents = filtered.filter((c) => !c.parent_id);
    const childMap = {};
    filtered
      .filter((c) => c.parent_id)
      .forEach((c) => {
        if (!childMap[c.parent_id]) childMap[c.parent_id] = [];
        childMap[c.parent_id].push(c);
      });
    return parents.map((p) => ({
      ...p,
      children: (childMap[p.id] || []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }));
  }, [filtered]);

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleAddSub = useCallback(
    (parent) => {
      setEditTarget({
        _isNewSub: true,
        parent_id: parent.id,
        type: parent.type,
        color: parent.color,
      });
      setFormOpen(true);
    },
    [],
  );

  const handleEdit = useCallback((cat) => {
    setEditTarget(cat);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (cat) => {
      // 연결된 거래 수 확인
      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("category_id", cat.id);

      if (error) {
        await confirm({
          title: "오류",
          message: "확인 중 오류가 발생했습니다",
          confirmText: "확인",
          cancelText: "",
          variant: "danger",
        });
        return;
      }

      const message =
        count > 0
          ? `"${cat.name}" 카테고리를 삭제하시겠습니까?\n연결된 ${count}건의 거래가 미분류로 변경됩니다.`
          : `"${cat.name}" 카테고리를 삭제하시겠습니까?`;

      const ok = await confirm({
        title: "카테고리 삭제",
        message,
        confirmText: "삭제",
        variant: count > 0 ? "warning" : "danger",
      });
      if (ok) deleteCategory.mutate(cat.id);
    },
    [deleteCategory, confirm],
  );

  if (isLoading && categories.length === 0) return <CategoriesSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">카테고리 관리</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
        >
          <Plus size={16} />
          카테고리 추가
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-light rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-5 py-2 rounded-md text-[13px] font-medium cursor-pointer border-none transition-colors ${
              activeTab === tab.value
                ? "bg-surface text-text shadow-sm"
                : "bg-transparent text-sub hover:text-text"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-[12px] text-sub">
              {categories.filter((c) => c.type === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="dash-card bg-surface shadow-sm rounded-2xl p-10 text-center">
          <p className="text-sub text-sm mb-3">
            {activeTab === "expense" ? "지출" : "수입"} 카테고리가 없습니다
          </p>
          <button
            onClick={handleAdd}
            className="text-mint text-sm font-medium cursor-pointer bg-transparent border-none"
          >
            카테고리를 추가해보세요 →
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col gap-3"
          onClick={() => setOpenCardId(null)}
        >
          {hierarchyList.map((parent) => (
            <div key={parent.id}>
              <SwipeableCard
                cardId={parent.id}
                openCardId={openCardId}
                onOpenChange={setOpenCardId}
                actions={[
                  {
                    key: "edit",
                    label: "수정",
                    icon: <Pencil size={18} />,
                    className: "bg-mint",
                    onClick: () => handleEdit(parent),
                  },
                  {
                    key: "delete",
                    label: "삭제",
                    icon: <Trash2 size={18} />,
                    className: "bg-coral",
                    onClick: () => handleDelete(parent),
                  },
                ]}
              >
                <CategoryCard
                  category={parent}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </SwipeableCard>

              {/* Sub-categories */}
              {parent.children.length > 0 && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {parent.children.map((sub) => (
                    <SwipeableCard
                      key={sub.id}
                      cardId={sub.id}
                      openCardId={openCardId}
                      onOpenChange={setOpenCardId}
                      actions={[
                        {
                          key: "edit",
                          label: "수정",
                          icon: <Pencil size={18} />,
                          className: "bg-mint",
                          onClick: () => handleEdit(sub),
                        },
                        {
                          key: "delete",
                          label: "삭제",
                          icon: <Trash2 size={18} />,
                          className: "bg-coral",
                          onClick: () => handleDelete(sub),
                        },
                      ]}
                    >
                      <CategoryCard
                        category={sub}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isSub
                      />
                    </SwipeableCard>
                  ))}
                </div>
              )}

              {/* Add sub button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSub(parent);
                }}
                className="ml-6 mt-1 px-3 py-1.5 text-[11px] text-sub font-medium bg-transparent border border-dashed border-border rounded-lg cursor-pointer hover:border-mint hover:text-mint transition-colors"
              >
                + 서브 카테고리
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <CategoryForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        editCategory={editTarget}
        defaultType={activeTab}
      />
    </div>
  );
};

export default Categories;

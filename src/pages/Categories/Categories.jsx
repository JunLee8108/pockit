import { useState, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCategories, useDeleteCategory } from "../../hooks/useCategories";
import supabase from "../../lib/supabase";
import CategoryCard from "./CategoryCard";
import CategoryForm from "./CategoryForm";
import CategoriesSkeleton from "./CategoriesSkeleton";
import SwipeableCard from "../Accounts/SwipeableCard";

const TABS = [
  { value: "expense", label: "지출" },
  { value: "income", label: "수입" },
];

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [activeTab, setActiveTab] = useState("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [openCardId, setOpenCardId] = useState(null);

  const filtered = useMemo(
    () => categories.filter((c) => c.type === activeTab),
    [categories, activeTab],
  );

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

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
        alert("확인 중 오류가 발생했습니다");
        return;
      }

      const msg =
        count > 0
          ? `"${cat.name}" 카테고리를 삭제하시겠습니까?\n연결된 ${count}건의 거래가 미분류로 변경됩니다.`
          : `"${cat.name}" 카테고리를 삭제하시겠습니까?`;

      if (window.confirm(msg)) {
        deleteCategory.mutate(cat.id);
      }
    },
    [deleteCategory],
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
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
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
          className="flex flex-col gap-2"
          onClick={() => setOpenCardId(null)}
        >
          {filtered.map((cat) => (
            <SwipeableCard
              key={cat.id}
              cardId={cat.id}
              openCardId={openCardId}
              onOpenChange={setOpenCardId}
              actions={[
                {
                  key: "edit",
                  label: "수정",
                  icon: <Pencil size={18} />,
                  className: "bg-mint",
                  onClick: () => handleEdit(cat),
                },
                {
                  key: "delete",
                  label: "삭제",
                  icon: <Trash2 size={18} />,
                  className: "bg-coral",
                  onClick: () => handleDelete(cat),
                },
              ]}
            >
              <CategoryCard
                category={cat}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </SwipeableCard>
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

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useTaskCategories,
  useDeleteTaskCategory,
} from "../../hooks/useTaskCategories";
import supabase from "../../lib/supabase";
import useConfirm from "../../hooks/useConfirm";
import CategoryIcon from "../../components/CategoryIcon";
import TaskCategoryForm from "./TaskCategoryForm";
import SwipeableCard from "../Accounts/SwipeableCard";

const TaskCategoryCard = ({ category, onEdit, onDelete }) => (
  <div
    id={`task-cat-${category.id}`}
    className="dash-card bg-surface shadow-sm rounded-xl p-4 flex items-center gap-3 group"
  >
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{ backgroundColor: category.color + "18" }}
    >
      <CategoryIcon
        name={category.icon}
        size={18}
        style={{ color: category.color }}
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[14px] font-medium text-text truncate">
        {category.name}
      </div>
      {category.is_default && (
        <span className="text-[11px] text-sub">기본</span>
      )}
    </div>
    <div
      className="w-3.5 h-3.5 rounded-full shrink-0"
      style={{ backgroundColor: category.color }}
    />
    <div className="hover-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(category);
        }}
        className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(category);
        }}
        className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

const TaskCategories = () => {
  const { data: categories = [], isLoading } = useTaskCategories();
  const deleteCategory = useDeleteTaskCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [openCardId, setOpenCardId] = useState(null);
  const confirm = useConfirm();

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
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("category_id", cat.id);

      const message =
        count > 0
          ? `"${cat.name}" 카테고리를 삭제하시겠습니까?\n연결된 ${count}건의 할일이 미분류로 변경됩니다.`
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">할일 카테고리</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
        >
          <Plus size={16} />
          카테고리 추가
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="dash-card bg-surface rounded-xl"
              style={{ height: 64 }}
            >
              <div
                className="skeleton"
                style={{ width: "100%", height: "100%", borderRadius: 12 }}
              />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="dash-card bg-surface shadow-sm rounded-2xl p-10 text-center">
          <p className="text-sub text-sm mb-3">카테고리가 없습니다</p>
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
          {categories.map((cat) => (
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
              <TaskCategoryCard
                category={cat}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </SwipeableCard>
          ))}
        </div>
      )}

      <TaskCategoryForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        editCategory={editTarget}
      />
    </div>
  );
};

export default TaskCategories;

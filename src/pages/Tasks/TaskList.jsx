import { Pencil, Trash2 } from "lucide-react";
import TaskItem from "./TaskItem";
import SwipeableCard from "../Accounts/SwipeableCard";

const TaskList = ({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  openCardId,
  onOpenChange,
  emptyText = "할일이 없습니다",
  emptyAction = null,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="dash-card bg-surface shadow-sm rounded-2xl p-10 text-center">
        <p className="text-sub text-sm mb-3">{emptyText}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2"
      onClick={() => onOpenChange?.(null)}
    >
      {tasks.map((task) => (
        <SwipeableCard
          key={task.id}
          cardId={task.id}
          openCardId={openCardId}
          onOpenChange={onOpenChange}
          actions={[
            {
              key: "edit",
              label: "수정",
              icon: <Pencil size={18} />,
              className: "bg-mint",
              onClick: () => onEdit(task),
            },
            {
              key: "delete",
              label: "삭제",
              icon: <Trash2 size={18} />,
              className: "bg-coral",
              onClick: () => onDelete(task),
            },
          ]}
        >
          <TaskItem
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </SwipeableCard>
      ))}
    </div>
  );
};

export default TaskList;

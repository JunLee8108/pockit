import { useState, useCallback, useEffect, useMemo } from "react";
import { Plus, List, Calendar as CalendarIcon } from "lucide-react";
import {
  useTasks,
  useToggleTask,
  useDeleteTask,
} from "../../hooks/useTasks";
import {
  useTaskCategories,
  useSeedDefaultTaskCategories,
} from "../../hooks/useTaskCategories";
import useConfirm from "../../hooks/useConfirm";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import TaskCalendar from "./TaskCalendar";
import QuickAdd from "./QuickAdd";

const TABS = [
  { value: "today", label: "오늘" },
  { value: "upcoming", label: "예정" },
  { value: "no-date", label: "기한없음" },
  { value: "done", label: "완료" },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const Tasks = () => {
  const [view, setView] = useState("list"); // list | calendar
  const [scope, setScope] = useState("today");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [defaultTitle, setDefaultTitle] = useState("");
  const [openCardId, setOpenCardId] = useState(null);
  const confirm = useConfirm();

  // 카테고리 자동 시드 (최초 진입 시)
  const { data: categories } = useTaskCategories();
  const seed = useSeedDefaultTaskCategories();
  useEffect(() => {
    if (categories && categories.length === 0 && !seed.isPending) {
      seed.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const toggle = useToggleTask();
  const deleteTask = useDeleteTask();

  // 목록 뷰: scope 기반 필터
  const listFilter = useMemo(() => ({ scope }), [scope]);
  const { data: filteredTasks = [], isLoading, rawData } = useTasks(listFilter);

  // 카운트
  const counts = useMemo(() => {
    const today = todayStr();
    const counts = { today: 0, upcoming: 0, "no-date": 0, done: 0, overdue: 0 };
    rawData.forEach((t) => {
      if (t.status === "done") counts.done += 1;
      else if (!t.due_date) counts["no-date"] += 1;
      else if (t.due_date < today) {
        counts.overdue += 1;
        counts.today += 1;
      } else if (t.due_date === today) counts.today += 1;
      else counts.upcoming += 1;
    });
    return counts;
  }, [rawData]);

  const handleAdd = (date = null, title = "") => {
    setEditTarget(null);
    setDefaultDate(date);
    setDefaultTitle(title || "");
    setFormOpen(true);
  };

  const handleEdit = useCallback((task) => {
    setEditTarget(task);
    setDefaultDate(null);
    setDefaultTitle("");
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (task) => {
      const ok = await confirm({
        title: "할일 삭제",
        message: `"${task.title}" 할일을 삭제하시겠습니까?`,
        confirmText: "삭제",
        variant: "danger",
      });
      if (ok) deleteTask.mutate(task.id);
    },
    [deleteTask, confirm],
  );

  const handleToggle = useCallback(
    (task) => {
      toggle.mutate(task);
    },
    [toggle],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">할일</h2>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-light rounded-lg p-0.5">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium cursor-pointer border-none transition-colors ${
                view === "list"
                  ? "bg-surface text-text shadow-sm"
                  : "bg-transparent text-sub"
              }`}
              aria-label="목록 보기"
            >
              <List size={14} />
              목록
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium cursor-pointer border-none transition-colors ${
                view === "calendar"
                  ? "bg-surface text-text shadow-sm"
                  : "bg-transparent text-sub"
              }`}
              aria-label="캘린더 보기"
            >
              <CalendarIcon size={14} />
              캘린더
            </button>
          </div>
          <button
            onClick={() => handleAdd()}
            className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
          >
            <Plus size={16} />
            추가
          </button>
        </div>
      </div>

      {view === "list" && (
        <>
          <QuickAdd onOpenFull={(t) => handleAdd(null, t)} />

          {/* Tabs */}
          <div className="flex gap-1 bg-light rounded-lg p-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setScope(tab.value)}
                className={`px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border-none transition-colors whitespace-nowrap ${
                  scope === tab.value
                    ? "bg-surface text-text shadow-sm"
                    : "bg-transparent text-sub hover:text-text"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-[12px] text-sub">
                  {counts[tab.value]}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="dash-card bg-surface rounded-xl"
                  style={{ height: 64 }}
                >
                  <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                </div>
              ))}
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              openCardId={openCardId}
              onOpenChange={setOpenCardId}
              emptyText={
                scope === "done"
                  ? "완료된 할일이 없습니다"
                  : scope === "no-date"
                    ? "기한 없는 할일이 없습니다"
                    : "할일이 없습니다"
              }
              emptyAction={
                <button
                  onClick={() => handleAdd()}
                  className="text-mint text-sm font-medium cursor-pointer bg-transparent border-none"
                >
                  할일을 추가해보세요 →
                </button>
              }
            />
          )}
        </>
      )}

      {view === "calendar" && (
        <TaskCalendar
          tasks={rawData}
          onAddForDate={handleAdd}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
          setDefaultDate(null);
          setDefaultTitle("");
        }}
        editTask={editTarget}
        defaultDate={defaultDate}
        defaultTitle={defaultTitle}
      />
    </div>
  );
};

export default Tasks;

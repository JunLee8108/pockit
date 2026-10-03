import { useState, useCallback, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
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
import WeekCalendar from "./WeekCalendar";
import DayPlanner from "./DayPlanner";
import WeekPlanner from "./WeekPlanner";
import QuickAdd from "./QuickAdd";
import useViewport from "../../hooks/useViewport";
import { scopeChoices } from "../../utils/recurrence";
import { todayStr } from "../../utils/planner";

const VIEWS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "주간" },
  { value: "month", label: "월간" },
  { value: "list", label: "할일함" },
];

const VIEW_KEY = "pockit:planner-view";

const loadView = () => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return VIEWS.some((x) => x.value === v) ? v : "day";
  } catch {
    return "day";
  }
};

const TABS = [
  { value: "today", label: "오늘" },
  { value: "upcoming", label: "예정" },
  { value: "no-date", label: "기한없음" },
  { value: "done", label: "완료" },
];

const Tasks = () => {
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const [view, setViewState] = useState(loadView); // day | week | month | list
  const [plannerDate, setPlannerDate] = useState(todayStr);
  const [scope, setScope] = useState("today");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formDefaults, setFormDefaults] = useState({});
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

  const setView = (v) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // 저장 실패는 무시 (시크릿 모드 등)
    }
  };

  const openDay = (date) => {
    setPlannerDate(date);
    setView("day");
  };

  const toggle = useToggleTask();
  const deleteTask = useDeleteTask();

  // 목록 뷰: scope 기반 필터
  const listFilter = useMemo(() => ({ scope }), [scope]);
  const {
    data: filteredTasks = [],
    isLoading,
    rawData,
    items,
  } = useTasks(listFilter);

  // 카운트
  const counts = useMemo(() => {
    const today = todayStr();
    const counts = { today: 0, upcoming: 0, "no-date": 0, done: 0, overdue: 0 };
    items.forEach((t) => {
      if (t.status === "done") counts.done += 1;
      else if (!t.due_date) counts["no-date"] += 1;
      else if (t.due_date < today) {
        counts.overdue += 1;
        counts.today += 1;
      } else if (t.due_date === today) counts.today += 1;
      else counts.upcoming += 1;
    });
    return counts;
  }, [items]);

  // defaults: { date, title, kind, time, endTime }
  const handleAdd = (defaults = {}) => {
    setEditTarget(null);
    setFormDefaults(defaults);
    setFormOpen(true);
  };

  const handleEdit = useCallback((task) => {
    setEditTarget(task);
    setFormDefaults({});
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (task) => {
      const noun = task.kind === "event" ? "일정" : "할일";
      if (task.series) {
        const scope = await confirm({
          title: `반복 ${noun} 삭제`,
          choices: scopeChoices(task.kind),
          confirmText: "삭제",
          variant: "danger",
        });
        if (scope) deleteTask.mutate({ task, scope });
        return;
      }
      const ok = await confirm({
        title: `${noun} 삭제`,
        message: `"${task.title}" ${noun}을 삭제하시겠습니까?`,
        confirmText: "삭제",
        variant: "danger",
      });
      if (ok) deleteTask.mutate({ task });
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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">플래너</h2>
        <button
          onClick={() =>
            handleAdd(view === "day" || view === "week" ? { date: plannerDate } : {})
          }
          className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
        >
          <Plus size={16} />
          추가
        </button>
      </div>

      {/* View tabs */}
      <div className="flex bg-light rounded-lg p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={`flex-1 py-2 rounded-md text-[13px] font-medium cursor-pointer border-none transition-colors ${
              view === v.value
                ? "bg-surface text-text shadow-sm"
                : "bg-transparent text-sub hover:text-text"
            }`}
          >
            {v.label}
            {v.value === "list" && counts.today > 0 && (
              <span className="ml-1 text-[11px] text-sub">{counts.today}</span>
            )}
          </button>
        ))}
      </div>

      {view === "day" && (
        <DayPlanner
          tasks={rawData}
          listItems={items}
          date={plannerDate}
          onDateChange={setPlannerDate}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onToggle={handleToggle}
          isMobile={isMobile}
        />
      )}

      {view === "week" &&
        (isMobile ? (
          <WeekCalendar
            tasks={rawData}
            onAddForDate={(date) => handleAdd({ date })}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <WeekPlanner
            tasks={rawData}
            date={plannerDate}
            onDateChange={setPlannerDate}
            onOpenDay={openDay}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onToggle={handleToggle}
          />
        ))}

      {view === "month" && (
        <TaskCalendar
          tasks={rawData}
          onAddForDate={(date) => handleAdd({ date })}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {view === "list" && (
        <>
          <QuickAdd onOpenFull={(title) => handleAdd({ title })} />

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

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
          setFormDefaults({});
        }}
        editTask={editTarget}
        defaults={formDefaults}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Tasks;

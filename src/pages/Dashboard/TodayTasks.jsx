import { useMemo } from "react";
import { Link } from "react-router";
import { ListTodo, Check, ChevronRight } from "lucide-react";
import { useTasks, useToggleTask } from "../../hooks/useTasks";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PRIORITY_DOT = {
  low: "#94a3b8",
  normal: "#7dd3fc",
  high: "#ef4444",
};

const TodayTasks = () => {
  const { rawData = [] } = useTasks();
  const toggle = useToggleTask();

  const today = todayStr();

  const { todayTasks, overdueCount, doneCount } = useMemo(() => {
    let overdue = 0;
    let done = 0;
    const list = [];
    rawData.forEach((t) => {
      if (!t.due_date) return;
      if (t.status === "done") {
        if (t.due_date === today) done += 1;
        return;
      }
      if (t.due_date < today) overdue += 1;
      if (t.due_date <= today) list.push(t);
    });
    return { todayTasks: list, overdueCount: overdue, doneCount: done };
  }, [rawData, today]);

  const preview = todayTasks.slice(0, 5);
  const remaining = todayTasks.length - preview.length;

  return (
    <div className="dash-card bg-surface shadow-sm rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-mint" />
          <h3 className="text-[15px] font-semibold text-text">오늘 할일</h3>
          {overdueCount > 0 && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-error-bg text-error">
              지연 {overdueCount}
            </span>
          )}
        </div>
        <Link
          to="/tasks"
          className="flex items-center gap-0.5 text-[12px] text-sub hover:text-text"
        >
          전체보기
          <ChevronRight size={14} />
        </Link>
      </div>

      {todayTasks.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sub text-[13px] mb-1">
            {doneCount > 0
              ? `오늘 ${doneCount}건 완료! 수고하셨어요`
              : "오늘 할일이 없습니다"}
          </p>
          <Link
            to="/tasks"
            className="text-mint text-[13px] font-medium no-underline"
          >
            할일 추가하기 →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {preview.map((task) => {
            const overdue = task.due_date < today;
            return (
              <li key={task.id} className="flex items-center gap-2.5">
                <button
                  onClick={() => toggle.mutate(task)}
                  className="shrink-0 w-5 h-5 rounded-md border-2 border-border bg-transparent flex items-center justify-center cursor-pointer hover:border-mint transition-colors"
                  aria-label="완료"
                >
                  {task.status === "done" && (
                    <Check size={12} className="text-mint" strokeWidth={3} />
                  )}
                </button>
                <span
                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: PRIORITY_DOT[task.priority] }}
                />
                <span className="flex-1 text-[13px] text-text truncate">
                  {task.title}
                </span>
                {overdue && (
                  <span className="text-[11px] text-error font-medium shrink-0">
                    지연
                  </span>
                )}
                {task.due_time && (
                  <span className="text-[11px] text-sub shrink-0">
                    {task.due_time.slice(0, 5)}
                  </span>
                )}
              </li>
            );
          })}
          {remaining > 0 && (
            <li>
              <Link
                to="/tasks"
                className="block pt-1 text-[12px] text-sub no-underline hover:text-text"
              >
                + {remaining}건 더 보기
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default TodayTasks;

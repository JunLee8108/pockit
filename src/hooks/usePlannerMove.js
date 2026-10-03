import { useSaveTask } from "./useTasks";
import { moveUpdates, isSameSlot, fromMinutes } from "../utils/planner";

// 플래너 드래그 동작 — 반복 회차는 해당 회차만 바꿈 (캘린더 드래그와 동일)
const usePlannerMove = () => {
  const save = useSaveTask();

  // 시간축의 date/start(분)로 이동 (시간 미정 항목은 기본 길이로 배정)
  const move = (task, date, start) => {
    const updates = moveUpdates(task, date, start);
    if (isSameSlot(task, updates)) return;
    save.mutate({ task, updates, scope: "this" });
  };

  // 종료 시각 변경
  const resize = (task, end) => {
    save.mutate({ task, updates: { end_time: fromMinutes(end) }, scope: "this" });
  };

  // 시간 해제 → 해당 날짜의 시간 미정 할일로
  const unschedule = (task, date) => {
    if (!task.due_time && task.due_date === date) return;
    save.mutate({
      task,
      updates: { due_date: date, due_time: null, end_time: null },
      scope: "this",
    });
  };

  return { move, resize, unschedule };
};

export default usePlannerMove;

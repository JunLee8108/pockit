import { useState } from "react";
import { X } from "lucide-react";
import { useAddTask, useSaveTask } from "../../hooks/useTasks";
import { useTaskCategories } from "../../hooks/useTaskCategories";
import useConfirm from "../../hooks/useConfirm";
import CategoryIcon from "../../components/CategoryIcon";
import RecurrencePicker from "./RecurrencePicker";
import {
  scopeChoices,
  addDays,
  diffDays,
  buildRule,
  buildPresetRule,
  detectPreset,
  parseRule,
  customFromPreset,
  sameRule,
} from "../../utils/recurrence";
import {
  DEFAULT_BLOCK_MINUTES,
  toMinutes,
  fromMinutes,
} from "../../utils/planner";

const inputCls =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const KINDS = [
  { value: "task", label: "할일" },
  { value: "event", label: "일정" },
];

const PRIORITIES = [
  { value: "low", label: "낮음", color: "#94a3b8" },
  { value: "normal", label: "보통", color: "#7dd3fc" },
  { value: "high", label: "높음", color: "#ef4444" },
];

const TaskFormInner = ({
  onClose,
  editTask = null,
  defaultDate = null,
  defaultTitle = "",
  defaultKind = "task",
  defaultTime = "",
  defaultEndTime = "",
  onDelete = null,
}) => {
  const addTask = useAddTask();
  const saveTask = useSaveTask();
  const { data: categories = [] } = useTaskCategories();
  const confirm = useConfirm();

  const isEdit = !!editTask;
  // 반복 회차 수정 시 원본 시리즈
  const series = editTask?.series || null;
  const origRule = series?.recurrence_rule || editTask?.recurrence_rule || null;

  const [kind, setKind] = useState(editTask?.kind || defaultKind);
  const [title, setTitle] = useState(editTask?.title || defaultTitle || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [dueDate, setDueDate] = useState(
    editTask?.due_date || defaultDate || "",
  );
  const [dueTime, setDueTime] = useState(
    editTask?.due_time?.slice(0, 5) || defaultTime || "",
  );
  const [endTime, setEndTime] = useState(
    editTask?.end_time?.slice(0, 5) || defaultEndTime || "",
  );
  const [priority, setPriority] = useState(editTask?.priority || "normal");
  const [categoryId, setCategoryId] = useState(editTask?.category_id || "");
  const [error, setError] = useState("");

  // 반복 프리셋 기준일: 반복 회차는 원래 회차 날짜, 그 외에는 입력한 기한일
  const anchor = editTask?.original_date || dueDate;
  const [preset, setPreset] = useState(() =>
    detectPreset(origRule, editTask?.original_date || editTask?.due_date || defaultDate),
  );
  const [custom, setCustom] = useState(() =>
    origRule ? parseRule(origRule) : customFromPreset("weekly", anchor),
  );

  const ruleFor = (date) =>
    preset === "custom" ? buildRule(custom, date) : buildPresetRule(preset, date);

  const submitting = addTask.isPending || saveTask.isPending;
  const isEventKind = kind === "event";
  const noun = isEventKind ? "일정" : "할일";

  // 일정은 시작 시각을 넣으면 종료를 1시간 뒤로 맞춤 (구글 캘린더처럼)
  const handleStartChange = (value) => {
    setDueTime(value);
    if (!value) {
      setEndTime("");
      return;
    }
    if (isEventKind && (!endTime || endTime <= value)) {
      setEndTime(fromMinutes(toMinutes(value) + DEFAULT_BLOCK_MINUTES));
    } else if (endTime && endTime <= value) {
      setEndTime("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("제목을 입력하세요");
      return;
    }
    if (isEventKind && !dueDate) {
      setError("일정은 날짜가 필요합니다");
      return;
    }
    if (dueTime && endTime && endTime <= dueTime) {
      setError("종료 시각은 시작 시각 이후여야 합니다");
      return;
    }

    const repeating = preset !== "none";
    if (repeating && !dueDate) {
      setError("반복하려면 날짜가 필요합니다");
      return;
    }
    if (
      repeating &&
      preset === "custom" &&
      custom.endType === "until" &&
      (!custom.until || custom.until < dueDate)
    ) {
      setError("반복 종료일은 시작 날짜 이후여야 합니다");
      return;
    }

    const time = (dueDate && dueTime) || null;
    const payload = {
      kind,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      due_time: time,
      end_time: (time && endTime) || null,
      priority: isEventKind ? "normal" : priority,
      category_id: categoryId || null,
    };

    try {
      if (!isEdit) {
        const rule = ruleFor(dueDate);
        await addTask.mutateAsync(rule ? { ...payload, recurrence_rule: rule } : payload);
      } else if (!series) {
        const rule = ruleFor(dueDate);
        await saveTask.mutateAsync({
          task: editTask,
          updates: rule || origRule ? { ...payload, recurrence_rule: rule } : payload,
        });
      } else {
        // 반복 회차: 구글 캘린더처럼 수정 범위 선택
        // 반복 규칙을 바꾸면 "이 할일"만 수정은 불가
        const ruleChanged = !sameRule(ruleFor(anchor), origRule);
        const choices = scopeChoices(kind);
        const scope = await confirm({
          title: `반복 ${noun} 수정`,
          choices: ruleChanged ? choices.slice(1) : choices,
          confirmText: "저장",
          variant: "info",
        });
        if (!scope) return;

        let updates = payload;
        if (scope !== "this") {
          // 날짜를 옮긴 만큼 시리즈 기준일도 이동
          const delta =
            dueDate && editTask.due_date ? diffDays(dueDate, editTask.due_date) : 0;
          const seriesDate = dueDate ? addDays(anchor, delta) : null;
          updates = {
            ...payload,
            due_date: seriesDate,
            recurrence_rule: ruleFor(seriesDate),
          };
        }
        await saveTask.mutateAsync({ task: editTask, updates, scope });
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
        {/* Kind */}
        <div className="flex bg-light rounded-lg p-0.5">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={`flex-1 py-2 rounded-md text-[13px] font-medium cursor-pointer border-none transition-colors ${
                kind === k.value
                  ? "bg-surface text-text shadow-sm"
                  : "bg-transparent text-sub"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isEventKind ? "예: 팀 회의, 병원 예약" : "예: 보고서 작성, 운동 가기"}
            required
            autoFocus={!isEdit}
            className={inputCls}
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">
            {isEventKind ? "날짜 *" : "기한일"}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Time range */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[13px] text-sub font-medium">
                {isEventKind ? "시작" : "시각"}
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => handleStartChange(e.target.value)}
                disabled={!dueDate}
                className={inputCls}
              />
            </div>
            <span className="pb-2.5 text-sub">~</span>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[13px] text-sub font-medium">
                종료{isEventKind ? "" : " (선택)"}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!dueDate || !dueTime}
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-[12px] text-sub">
            {isEventKind
              ? "시간을 비우면 종일 일정으로 표시됩니다"
              : "시작·종료 시각을 넣으면 플래너에 시간 블록으로 표시됩니다"}
          </p>
        </div>

        {/* Recurrence */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">반복</label>
          <RecurrencePicker
            date={anchor}
            preset={preset}
            onPresetChange={setPreset}
            custom={custom}
            onCustomChange={setCustom}
          />
        </div>

        {/* Priority (할일만) */}
        {!isEventKind && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-sub font-medium">우선순위</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-colors ${
                    priority === p.value ? "text-white" : "bg-light text-sub"
                  }`}
                  style={
                    priority === p.value ? { backgroundColor: p.color } : undefined
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">카테고리</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId("")}
              className={`px-3 py-1.5 rounded-lg text-[13px] cursor-pointer border transition-colors ${
                !categoryId
                  ? "border-mint bg-mint-bg text-mint font-semibold"
                  : "border-border bg-bg text-sub"
              }`}
            >
              없음
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer border transition-colors ${
                  categoryId === c.id
                    ? "border-mint bg-mint-bg font-semibold"
                    : "border-border bg-bg"
                }`}
                style={{ color: categoryId === c.id ? c.color : undefined }}
              >
                <CategoryIcon name={c.icon} size={14} style={{ color: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">메모</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="추가 설명 (선택)"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex gap-2 mt-2">
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(editTask);
              }}
              className="px-5 py-3 rounded-lg text-[15px] font-semibold text-error bg-error-bg border-none cursor-pointer"
            >
              삭제
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 py-3 rounded-lg text-[15px] font-semibold text-white border-none cursor-pointer transition-colors ${
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
                : `${noun} 추가`}
          </button>
        </div>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const TaskForm = ({
  open,
  onClose,
  editTask = null,
  // 새 항목 기본값: { date, title, kind, time, endTime }
  defaults = {},
  onDelete = null,
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
            {editTask
              ? editTask.kind === "event"
                ? "일정 수정"
                : "할일 수정"
              : "새로 만들기"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <TaskFormInner
          key={editTask?.id || `new-${JSON.stringify(defaults)}`}
          onClose={handleClose}
          editTask={editTask}
          defaultDate={defaults.date || null}
          defaultTitle={defaults.title || ""}
          defaultKind={defaults.kind || "task"}
          defaultTime={defaults.time || ""}
          defaultEndTime={defaults.endTime || ""}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default TaskForm;

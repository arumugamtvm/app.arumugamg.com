import React, { useState } from "react";
import type { Todo, RecurrenceRule, RecurrenceFrequency, Subtask } from "../types";
import { SubtaskList } from "./SubtaskList";
import { Trash2, CheckCircle2, Circle, Edit2, Save, X, ChevronDown, ChevronUp, Repeat, Tag } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  subtasks?: Subtask[];
  isSelected?: boolean;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (
    id: number,
    fields: {
      title?: string;
      priority?: "low" | "normal" | "high";
      description?: string;
      due_date?: string;
      recurrence?: RecurrenceRule | null;
      labels?: string[];
    }
  ) => Promise<void>;
  onSubtaskCreate?: (todoId: number, title: string) => Promise<void>;
  onSubtaskToggle?: (id: number) => Promise<void>;
  onSubtaskUpdate?: (id: number, title: string) => Promise<void>;
  onSubtaskDelete?: (id: number) => Promise<void>;
  onToggleSelect?: (id: number) => void;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  subtasks = [],
  isSelected = false,
  onToggle,
  onDelete,
  onUpdate,
  onSubtaskCreate,
  onSubtaskToggle,
  onSubtaskUpdate,
  onSubtaskDelete,
  onToggleSelect,
}) => {
  const isCompleted = todo.status === "done";
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || "");
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [editDueDate, setEditDueDate] = useState(todo.due_date ?? "");
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceFrequency | "none">(
    todo.recurrence ? (JSON.parse(todo.recurrence).frequency as RecurrenceFrequency) : "none"
  );
  const [editCustomWeekdays, setEditCustomWeekdays] = useState<number[]>(() => {
    if (!todo.recurrence) return [];
    try {
      const rule = JSON.parse(todo.recurrence) as RecurrenceRule;
      return rule.weekdays ?? [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  const parseRecurrence = (): RecurrenceRule | undefined => {
    if (!todo.recurrence) return undefined;
    try {
      return JSON.parse(todo.recurrence) as RecurrenceRule;
    } catch {
      return undefined;
    }
  };

  const recurrenceRule = parseRecurrence();
  const doneSubtasks = subtasks.filter((s) => s.status === "done").length;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const toggleWeekday = (day: number) => {
    setEditCustomWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const buildRecurrence = (): RecurrenceRule | null => {
    if (editRecurrence === "none") return null;
    if (editRecurrence === "custom") {
      if (editCustomWeekdays.length === 0) return null;
      return { frequency: "custom", weekdays: editCustomWeekdays };
    }
    return { frequency: editRecurrence };
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    if (editRecurrence === "custom" && editCustomWeekdays.length === 0) return;
    setLoading(true);
    try {
      const isRecurring = todo.recurring_group_id !== null;
      await onUpdate(todo.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        due_date: editDueDate || undefined,
        recurrence: isRecurring ? undefined : buildRecurrence(),
      });
      setIsEditing(false);
    } catch {
      // keep edit state open
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditPriority(todo.priority);
    setEditDueDate(todo.due_date ?? "");
    setEditRecurrence(recurrenceRule ? recurrenceRule.frequency : "none");
    setEditCustomWeekdays(recurrenceRule?.weekdays ?? []);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className={`todo-item-container editing priority-${editPriority}`}>
        <div className="todo-edit-form" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="todo-input"
              style={{ flex: 1, padding: "6px 12px", fontSize: "0.85rem" }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
              disabled={loading}
              required
            />
            <select
              className="priority-select"
              style={{ padding: "6px 8px", fontSize: "0.8rem" }}
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as "low" | "normal" | "high")}
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          <input
            type="text"
            className="todo-input"
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Add details / description..."
            disabled={loading}
          />

          <input
            type="date"
            className="todo-input"
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            disabled={loading}
          />

          <select
            className="priority-select"
            style={{ padding: "6px 8px", fontSize: "0.78rem" }}
            value={editRecurrence}
            onChange={(e) => setEditRecurrence(e.target.value as RecurrenceFrequency | "none")}
            disabled={loading || todo.recurring_group_id !== null}
            title={todo.recurring_group_id !== null ? "Recurrence cannot be changed on an existing series" : undefined}
          >
            <option value="none">No recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekends">Weekends</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>

          {editRecurrence === "custom" && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem" }}>Repeat on:</span>
              {WEEKDAY_LABELS.map((label, day) => (
                <label key={label} style={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="checkbox"
                    checked={editCustomWeekdays.includes(day)}
                    onChange={() => toggleWeekday(day)}
                    disabled={loading}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "4px" }}>
            <button className="btn btn-ghost btn-xs" onClick={handleCancel} disabled={loading}>
              <X size={12} />
              <span>Cancel</span>
            </button>
            <button className="btn btn-accent btn-xs" onClick={handleSave} disabled={loading || !editTitle.trim()}>
              <Save size={12} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </li>
    );
  }

  // Parse labels from JSON string if needed
  const labels: string[] = (() => {
    if (!todo.labels) return [];
    if (Array.isArray(todo.labels)) return todo.labels as string[];
    try { return JSON.parse(todo.labels as unknown as string) as string[]; } catch { return []; }
  })();

  return (
    <li
      className={`todo-item-container ${isCompleted ? "done" : ""} priority-${todo.priority} ${isSelected ? "todo-item-selected" : ""}`}
      onClick={onToggleSelect ? (e) => { if ((e.target as HTMLElement).closest('button, input, select, textarea') === null) onToggleSelect(todo.id); } : undefined}
      style={onToggleSelect ? { cursor: "pointer" } : undefined}
    >
      <button
        className="todo-toggle-btn"
        onClick={() => onToggle(todo.id)}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted ? <CheckCircle2 className="checked-icon" size={20} /> : <Circle className="unchecked-icon" size={20} />}
      </button>

      <div className="todo-content">
        <span className="todo-title-text">{todo.title}</span>
        {todo.description && (
          <p className="todo-description-text" style={{ fontSize: "0.78rem", color: "var(--clr-text-dim)", marginTop: "2px" }}>
            {todo.description}
          </p>
        )}
        <div className="todo-meta">
          <span className={`priority-badge-${todo.priority}`}>{todo.priority.toUpperCase()}</span>
          {todo.due_date && <span className="todo-date">{formatDate(todo.due_date)}</span>}
          {recurrenceRule && (
            <span className="todo-recurrence" style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "0.72rem" }}>
              <Repeat size={10} />
              {recurrenceRule.frequency}
            </span>
          )}
          {subtasks.length > 0 && (
            <span className="todo-subtask-progress" style={{ fontSize: "0.72rem" }}>
              {doneSubtasks}/{subtasks.length}
            </span>
          )}
          <span className="todo-date">{formatDate(todo.created_at)}</span>
        {/* Labels */}
          {labels.length > 0 && (
            <div className="todo-labels">
              <Tag size={9} style={{ flexShrink: 0 }} />
              {labels.map((label) => (
                <span key={label} className="label-chip">{label}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "4px", flexShrink: 0, alignItems: "center" }}>
        {onSubtaskCreate && (
          <button
            className="todo-delete-btn"
            style={{ color: "var(--clr-text-dim)" }}
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
        <button className="todo-delete-btn" style={{ color: "var(--clr-text-dim)" }} onClick={() => setIsEditing(true)} aria-label={`Edit ${todo.title}`}>
          <Edit2 size={14} />
        </button>
        <button className="todo-delete-btn" onClick={() => onDelete(todo.id)} aria-label={`Delete ${todo.title}`}>
          <Trash2 size={14} />
        </button>
      </div>

      {isExpanded && onSubtaskCreate && (
        <div style={{ gridColumn: "1 / -1", paddingLeft: "28px", marginTop: "8px" }}>
          <SubtaskList
            todoId={todo.id}
            subtasks={subtasks}
            onCreate={onSubtaskCreate}
            onToggle={onSubtaskToggle ?? (async () => {})}
            onUpdate={onSubtaskUpdate ?? (async () => {})}
            onDelete={onSubtaskDelete ?? (async () => {})}
          />
        </div>
      )}
    </li>
  );
};

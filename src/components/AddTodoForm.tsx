import React, { useState } from "react";
import type { RecurrenceRule, RecurrenceFrequency } from "../types";
import { PlusCircle } from "lucide-react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AddTodoFormProps {
  onAdd: (
    title: string,
    priority: "low" | "normal" | "high",
    description?: string,
    dueDate?: string,
    recurrence?: RecurrenceRule,
    subtasks?: string[]
  ) => Promise<void>;
  loading: boolean;
}

export const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAdd, loading }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | "none">("none");
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, newSubtask.trim()]);
    setNewSubtask("");
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleWeekday = (day: number) => {
    setCustomWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const buildRecurrence = (): RecurrenceRule | undefined => {
    if (recurrence === "none") return undefined;
    if (recurrence === "custom") {
      if (customWeekdays.length === 0) return undefined;
      return { frequency: "custom", weekdays: customWeekdays };
    }
    return { frequency: recurrence };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;
    const recurrenceRule = buildRecurrence();
    if (recurrence === "custom" && customWeekdays.length === 0) return;

    await onAdd(
      title.trim(),
      priority,
      description.trim() || undefined,
      dueDate || undefined,
      recurrenceRule,
      subtasks.length > 0 ? subtasks : undefined
    );

    setTitle("");
    setPriority("normal");
    setDescription("");
    setDueDate("");
    setRecurrence("none");
    setCustomWeekdays([]);
    setSubtasks([]);
  };

  return (
    <form className="add-todo-form" onSubmit={handleSubmit}>
      <div className="input-group-vertical" style={{ gap: "10px" }}>
        <div className="input-group">
          <input
            type="text"
            className="todo-input"
            placeholder="Plan your next target..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
          <select
            className="priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high")}
            disabled={loading}
          >
            <option value="low">Low Priority</option>
            <option value="normal">Normal Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button type="submit" className="btn btn-accent" disabled={loading || !title.trim()}>
            <PlusCircle size={16} />
            <span>Add</span>
          </button>
        </div>

        <input
          type="text"
          className="todo-input"
          style={{ fontSize: "0.82rem", padding: "8px 12px" }}
          placeholder="Add description/details (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        <input
          type="date"
          className="todo-input"
          placeholder="Due date (optional)"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
        />

        <select
          className="priority-select"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency | "none")}
          disabled={loading}
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

        {recurrence === "custom" && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem" }}>Repeat on:</span>
            {WEEKDAY_LABELS.map((label, day) => (
              <label key={label} className="checkbox-label" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="checkbox"
                  checked={customWeekdays.includes(day)}
                  onChange={() => toggleWeekday(day)}
                  disabled={loading}
                />
                {label}
              </label>
            ))}
          </div>
        )}

        <div className="subtasks-input-group">
          <div className="subtask-input-container" style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="todo-input"
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubtask())}
              disabled={loading}
            />
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleAddSubtask}
              disabled={!newSubtask.trim() || loading}
            >
              Add
            </button>
          </div>

          {subtasks.length > 0 && (
            <div className="subtasks-chips-container" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
              {subtasks.map((subtask, index) => (
                <span key={index} className="subtask-chip" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {subtask}
                  <button
                    type="button"
                    className="remove-subtask-btn"
                    onClick={() => handleRemoveSubtask(index)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

import React, { useState } from "react";
import type { Todo } from "../types";
import { Trash2, CheckCircle2, Circle, Edit2, Save, X } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, fields: { title?: string; priority?: "low" | "normal" | "high"; description?: string }) => Promise<void>;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onUpdate }) => {
  const isCompleted = todo.status === "done";
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || "");
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setLoading(true);
    try {
      await onUpdate(todo.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
      });
      setIsEditing(false);
    } catch {
      // Keep edit state open if update fails
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditPriority(todo.priority);
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

  return (
    <li className={`todo-item-container ${isCompleted ? "done" : ""} priority-${todo.priority}`}>
      <button
        className="todo-toggle-btn"
        onClick={() => onToggle(todo.id)}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted ? (
          <CheckCircle2 className="checked-icon" size={20} />
        ) : (
          <Circle className="unchecked-icon" size={20} />
        )}
      </button>
      
      <div className="todo-content">
        <span className="todo-title-text">{todo.title}</span>
        {todo.description && (
          <p className="todo-description-text" style={{ fontSize: "0.78rem", color: "var(--clr-text-dim)", marginTop: "2px" }}>
            {todo.description}
          </p>
        )}
        <div className="todo-meta">
          <span className={`priority-badge-${todo.priority}`}>
            {todo.priority.toUpperCase()}
          </span>
          {todo.created_at && (
            <span className="todo-date">{formatDate(todo.created_at)}</span>
          )}
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        <button
          className="todo-delete-btn"
          style={{ color: "var(--clr-text-dim)" }}
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${todo.title}`}
        >
          <Edit2 size={14} />
        </button>
        <button
          className="todo-delete-btn"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete ${todo.title}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
};

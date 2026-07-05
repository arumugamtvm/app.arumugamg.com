import React, { useState } from "react";
import type { Subtask } from "../types";
import { CheckCircle2, Circle, Edit3, Trash2 } from "lucide-react";

interface SubtaskListProps {
  todoId: number;
  subtasks: Subtask[];
  onCreate: (todoId: number, title: string) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
  onUpdate: (id: number, title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ 
  todoId, 
  subtasks, 
  onCreate, 
  onToggle, 
  onUpdate,
  onDelete,
  loading = false 
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || loading) return;
    
    await onCreate(todoId, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditTitle(subtask.title);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    await onUpdate(id, editTitle.trim());
    setEditingSubtaskId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditTitle("");
  };

  const progress = subtasks.length > 0 
    ? `${subtasks.filter(t => t.status === "done").length}/${subtasks.length}`
    : "0/0";

  return (
    <div className="subtask-list-container">
      <div className="subtask-progress">
        {progress} completed
      </div>
      
      <ul className="subtask-list">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className={`subtask-item ${subtask.status === "done" ? "completed" : ""}`}>
            {editingSubtaskId === subtask.id ? (
              <div className="subtask-edit-form">
                <input
                  type="text"
                  className="todo-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveEdit(subtask.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(subtask.id);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="subtask-content">
                <button
                  className="subtask-toggle-btn"
                  onClick={() => onToggle(subtask.id)}
                  aria-label={subtask.status === "done" ? "Mark incomplete" : "Mark complete"}
                >
                  {subtask.status === "done" ? (
                    <CheckCircle2 className="checked-icon" size={16} />
                  ) : (
                    <Circle className="unchecked-icon" size={16} />
                  )}
                </button>
                <span className="subtask-title-text">{subtask.title}</span>
                <div className="subtask-actions">
                  <button
                    className="subtask-edit-btn"
                    onClick={() => handleStartEdit(subtask)}
                    aria-label="Edit subtask"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    className="subtask-delete-btn"
                    onClick={() => onDelete(subtask.id)}
                    aria-label="Delete subtask"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form className="add-subtask-form" onSubmit={handleAddSubtask}>
        <input
          type="text"
          className="todo-input"
          placeholder="Add a subtask..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn btn-accent btn-xs"
          disabled={loading || !newSubtaskTitle.trim()}
        >
          Add
        </button>
      </form>
    </div>
  );
};
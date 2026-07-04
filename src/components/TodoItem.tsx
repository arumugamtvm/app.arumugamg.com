import React from "react";
import type { Todo } from "../types";
import { Trash2, CheckCircle2, Circle } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const isCompleted = todo.status === "done";
  
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
        <div className="todo-meta">
          <span className={`priority-badge-${todo.priority}`}>
            {todo.priority.toUpperCase()}
          </span>
          {todo.created_at && (
            <span className="todo-date">{formatDate(todo.created_at)}</span>
          )}
        </div>
      </div>
      
      <button
        className="todo-delete-btn"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete ${todo.title}`}
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
};

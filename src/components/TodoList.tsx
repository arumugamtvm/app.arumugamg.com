import React, { useState } from "react";
import type { Todo } from "../types";
import { TodoItem } from "./TodoItem";
import { ListFilter, Search, CheckSquare } from "lucide-react";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, fields: { title?: string; priority?: "low" | "normal" | "high"; description?: string }) => Promise<void>;
  loading: boolean;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggle,
  onDelete,
  onUpdate,
  loading,
}) => {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [search, setSearch] = useState("");

  const completedCount = todos.filter((t) => t.status === "done").length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter and Search logic
  const filteredTodos = todos.filter((todo) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "open" && todo.status === "open") ||
      (filter === "done" && todo.status === "done");
      
    // Include description in search filter as well
    const titleMatch = todo.title.toLowerCase().includes(search.toLowerCase());
    const descMatch = todo.description ? todo.description.toLowerCase().includes(search.toLowerCase()) : false;
    
    return matchesFilter && (titleMatch || descMatch);
  });

  return (
    <div className="todo-list-wrapper">
      {/* ── Statistics / Progress ── */}
      {totalCount > 0 && (
        <div className="progress-section">
          <div className="progress-label-row">
            <span className="stats-text">
              <CheckSquare size={14} className="stats-icon" />
              <strong>{completedCount}</strong> of <strong>{totalCount}</strong> tasks completed
            </span>
            <span className="percent-text">{progressPercent}%</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Filter & Search Toolbar ── */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <ListFilter size={16} className="filter-icon" />
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "open" ? "active" : ""}`}
            onClick={() => setFilter("open")}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filter === "done" ? "active" : ""}`}
            onClick={() => setFilter("done")}
          >
            Done
          </button>
        </div>
      </div>

      {/* ── Todo List Items ── */}
      {loading ? (
        <div className="loader-row">
          <span className="spinner large" />
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="empty-state">
          {search ? "No search results found." : "No tasks in this category."}
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

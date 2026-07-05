import React, { useState, useMemo } from "react";
import type { Todo, Subtask } from "../types";
import { TodoItem } from "./TodoItem";
import { CalendarView } from "./CalendarView";
import { ListFilter, Search, CheckSquare, List, CalendarDays, X } from "lucide-react";

type ViewMode = "list" | "calendar";

interface TodoListProps {
  todos: Todo[];
  selectedDate: string | null;
  selectedIds?: Set<number>;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, fields: { title?: string; priority?: "low" | "normal" | "high"; description?: string; labels?: string[] }) => Promise<void>;
  onSubtaskCreate?: (todoId: number, title: string) => Promise<void>;
  onSubtaskToggle?: (id: number) => Promise<void>;
  onSubtaskUpdate?: (id: number, title: string) => Promise<void>;
  onSubtaskDelete?: (id: number) => Promise<void>;
  onToggleSelect?: (id: number) => void;
  loading: boolean;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  calendarDate: Date;
  onChangeMonth: (offset: number) => void;
  onSelectDate: (date: string) => void;
  subtasks?: Subtask[];
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  selectedDate,
  selectedIds = new Set(),
  onToggle,
  onDelete,
  onUpdate,
  onSubtaskCreate,
  onSubtaskToggle,
  onSubtaskUpdate,
  onSubtaskDelete,
  onToggleSelect,
  loading,
  viewMode,
  onChangeViewMode,
  calendarDate,
  onChangeMonth,
  onSelectDate,
  subtasks = [],
}) => {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [search, setSearch] = useState("");

  const subtasksByTodo = useMemo(() => {
    const map = new Map<number, Subtask[]>();
    for (const subtask of subtasks) {
      const list = map.get(subtask.todo_id);
      if (list) {
        list.push(subtask);
      } else {
        map.set(subtask.todo_id, [subtask]);
      }
    }
    return map;
  }, [subtasks]);

  const completedCount = todos.filter((t) => t.status === "done").length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter and Search logic
  const filteredTodos = todos.filter((todo) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "open" && todo.status === "open") ||
      (filter === "done" && todo.status === "done");

    const matchesDate =
      !selectedDate || (todo.due_date !== null && todo.due_date === selectedDate);

    // Include description in search filter as well
    const titleMatch = todo.title.toLowerCase().includes(search.toLowerCase());
    const descMatch = todo.description ? todo.description.toLowerCase().includes(search.toLowerCase()) : false;

    return matchesFilter && matchesDate && (titleMatch || descMatch);
  });

  const handleClearDate = () => {
    onSelectDate("");
  };

  const formattedSelectedDate = selectedDate
    ? (() => {
        try {
          const parts = selectedDate.split("-").map((p) => Number(p));
          if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return selectedDate;
          const [y, m, d] = parts;
          const date = new Date(Date.UTC(y, m - 1, d));
          return date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          });
        } catch {
          return selectedDate;
        }
      })()
    : "";

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

        <div className="filter-group">
          <button
            className={`filter-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => onChangeViewMode("list")}
            aria-label="List view"
          >
            <List size={12} />
            <span style={{ marginLeft: "4px" }}>List</span>
          </button>
          <button
            className={`filter-btn ${viewMode === "calendar" ? "active" : ""}`}
            onClick={() => onChangeViewMode("calendar")}
            aria-label="Calendar view"
          >
            <CalendarDays size={12} />
            <span style={{ marginLeft: "4px" }}>Calendar</span>
          </button>
        </div>
      </div>

      {selectedDate && (
        <div className="selected-date-banner">
          <span className="selected-date-text">
            Showing tasks for <strong>{formattedSelectedDate}</strong>
          </span>
          <button className="btn btn-ghost btn-xs" onClick={handleClearDate}>
            <X size={12} />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* ── Calendar View ── */}
      {viewMode === "calendar" && (
        <CalendarView
          todos={todos}
          currentDate={calendarDate}
          selectedDate={selectedDate}
          onChangeMonth={onChangeMonth}
          onSelectDate={onSelectDate}
        />
      )}

      {/* ── Todo List Items (rendered in both list and calendar modes) ── */}
      {loading ? (
        <div className="loader-row">
          <span className="spinner large" />
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="empty-state">
          {search
            ? "No search results found."
            : selectedDate
              ? "No tasks due on this date."
              : "No tasks in this category."}
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              subtasks={subtasksByTodo.get(todo.id)}
              isSelected={selectedIds.has(todo.id)}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onSubtaskCreate={onSubtaskCreate}
              onSubtaskToggle={onSubtaskToggle}
              onSubtaskUpdate={onSubtaskUpdate}
              onSubtaskDelete={onSubtaskDelete}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  fetchTodos,
  fetchTodayTodos,
  fetchOverdueTodos,
  fetchUpcomingTodos,
  createTodo,
  updateTodo,
  completeTodo,
  reopenTodo,
  deleteTodo,
  bulkCompleteTodos,
  bulkDeleteTodos,
  fetchSubtasksForTodos,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "../api/todoApi";
import type { Todo, Subtask, RecurrenceRule } from "../types";
import { AuthCard } from "./AuthCard";
import { GlassCard } from "./GlassCard";
import { AddTodoForm } from "./AddTodoForm";
import { TodoList } from "./TodoList";
import { ErrorBanner } from "./ui/ErrorBanner";
import {
  ArrowLeft,
  CheckSquare,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface TodoWorkspaceProps {
  onBackToDashboard: () => void;
  sessionKey: number;
  onTokenChange: () => void;
}

export const TodoWorkspace: React.FC<TodoWorkspaceProps> = ({
  onBackToDashboard,
  sessionKey,
  onTokenChange,
}) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quickView, setQuickView] = useState<"all" | "today" | "upcoming" | "overdue">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [overdueCount, setOverdueCount] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const loadSubtasks = async (todosList: Todo[]) => {
    try {
      const ids = todosList.map((t) => t.id);
      if (ids.length === 0) {
        setSubtasks([]);
        return;
      }
      const data = await fetchSubtasksForTodos(ids);
      setSubtasks(data);
    } catch {
      console.warn("Failed to load subtasks in bulk.");
    }
  };

  const loadTodosByQuickView = async (view: "all" | "today" | "upcoming" | "overdue") => {
    setLoading(true);
    setError(null);
    try {
      let data: Todo[] = [];
      if (view === "all") data = await fetchTodos();
      else if (view === "today") data = await fetchTodayTodos();
      else if (view === "upcoming") data = await fetchUpcomingTodos(7);
      else if (view === "overdue") data = await fetchOverdueTodos();

      setTodos(data);
      await loadSubtasks(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const loadTodosForMonth = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
      const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
      const data = await fetchTodos("", start, end);
      setTodos(data);
      await loadSubtasks(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load tasks for month");
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueCount = async () => {
    try {
      const od = await fetchOverdueTodos();
      setOverdueCount(od.length);
    } catch {
      setOverdueCount(null);
    }
  };

  useEffect(() => {
    loadOverdueCount();
  }, [sessionKey]);

  useEffect(() => {
    if (viewMode === "list") {
      loadTodosByQuickView(quickView);
    } else {
      loadTodosForMonth(calendarDate);
    }
  }, [quickView, viewMode, calendarDate, sessionKey]);

  const handleQuickViewChange = (view: "all" | "today" | "upcoming" | "overdue") => {
    setViewMode("list");
    setSelectedDate(null);
    setQuickView(view);
  };

  const handleToggleSelectTodo = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkComplete = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      await bulkCompleteTodos(Array.from(selectedIds));
      if (viewMode === "list") await loadTodosByQuickView(quickView);
      else await loadTodosForMonth(calendarDate);
      setSelectedIds(new Set());
      await loadOverdueCount();
    } catch (err) {
      setError((err as Error).message || "Bulk complete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} task(s)?`)) return;
    setLoading(true);
    setError(null);
    try {
      await bulkDeleteTodos(Array.from(selectedIds));
      if (viewMode === "list") await loadTodosByQuickView(quickView);
      else await loadTodosForMonth(calendarDate);
      setSelectedIds(new Set());
      await loadOverdueCount();
    } catch (err) {
      setError((err as Error).message || "Bulk delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (
    title: string,
    priority: "low" | "normal" | "high",
    description?: string,
    dueDate?: string,
    recurrence?: RecurrenceRule,
    subtasksList?: string[],
    labels?: string[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      await createTodo(title, priority, description, dueDate, recurrence, subtasksList, labels);
      if (viewMode === "list") await loadTodosByQuickView(quickView);
      else await loadTodosForMonth(calendarDate);
      await loadOverdueCount();
    } catch (err) {
      setError((err as Error).message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    setLoading(true);
    setError(null);
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      setLoading(false);
      return;
    }
    try {
      if (todo.status === "open") await completeTodo(id);
      else await reopenTodo(id);

      if (viewMode === "list") await loadTodosByQuickView(quickView);
      else await loadTodosForMonth(calendarDate);
      await loadOverdueCount();
    } catch (err) {
      setError((err as Error).message || "Failed to update task status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      await loadOverdueCount();
    } catch (err) {
      setError((err as Error).message || "Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodo = async (
    id: number,
    fields: { title?: string; priority?: "low" | "normal" | "high"; description?: string; due_date?: string; recurrence?: RecurrenceRule; labels?: string[] }
  ) => {
    setLoading(true);
    setError(null);
    try {
      await updateTodo(id, fields);
      if (viewMode === "list") await loadTodosByQuickView(quickView);
      else await loadTodosForMonth(calendarDate);
    } catch (err) {
      setError((err as Error).message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleSubtaskCreate = async (todoId: number, title: string) => {
    setError(null);
    try {
      const newSt = await createSubtask(todoId, title);
      setSubtasks((prev) => [...prev, newSt]);
    } catch (err) {
      setError((err as Error).message || "Failed to add subtask.");
    }
  };

  const handleSubtaskToggle = async (id: number) => {
    setError(null);
    try {
      const current = subtasks.find(s => s.id === id);
      if (!current) return;
      const newStatus = current.status === "open" ? "done" : "open";
      const updatedSt = await updateSubtask(id, { status: newStatus });
      setSubtasks((prev) => prev.map((s) => (s.id === id ? updatedSt : s)));
    } catch (err) {
      setError((err as Error).message || "Failed to toggle subtask.");
    }
  };

  const handleSubtaskUpdate = async (id: number, newTitle: string) => {
    setError(null);
    try {
      const updatedSt = await updateSubtask(id, { title: newTitle });
      setSubtasks((prev) => prev.map((s) => (s.id === id ? updatedSt : s)));
    } catch (err) {
      setError((err as Error).message || "Failed to update subtask.");
    }
  };

  const handleSubtaskDelete = async (id: number) => {
    setError(null);
    try {
      await deleteSubtask(id);
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError((err as Error).message || "Failed to delete subtask.");
    }
  };

  return (
    <div className="workspace-shell todos-workspace-layout">
      <div className="workspace-header-row">
        {onBackToDashboard && (
          <button className="btn btn-ghost btn-sm back-btn" onClick={onBackToDashboard}>
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>
        )}
        <span className="workspace-badge">Tasks</span>
      </div>

      <AuthCard onTokenChange={onTokenChange} />

      {/* Quick View Tabs */}
      <div className="quick-view-tabs">
        <button
          id="qv-all"
          className={`quick-view-tab ${quickView === "all" ? "active" : ""}`}
          onClick={() => handleQuickViewChange("all")}
        >
          <CheckSquare size={13} />
          <span>All Tasks</span>
        </button>
        <button
          id="qv-today"
          className={`quick-view-tab ${quickView === "today" ? "active" : ""}`}
          onClick={() => handleQuickViewChange("today")}
        >
          <Calendar size={13} />
          <span>Today</span>
        </button>
        <button
          id="qv-upcoming"
          className={`quick-view-tab ${quickView === "upcoming" ? "active" : ""}`}
          onClick={() => handleQuickViewChange("upcoming")}
        >
          <Clock size={13} />
          <span>Upcoming</span>
        </button>
        <button
          id="qv-overdue"
          className={`quick-view-tab ${quickView === "overdue" ? "active" : ""} ${overdueCount ? "has-badge" : ""}`}
          onClick={() => handleQuickViewChange("overdue")}
        >
          <AlertTriangle size={13} />
          <span>Overdue</span>
          {overdueCount !== null && overdueCount > 0 && (
            <span className="tab-count-badge">{overdueCount}</span>
          )}
        </button>
      </div>

      <GlassCard className="todos-card" delay="0.15s">
        <div className="section-header">
          <h2 className="section-title">
            <CheckSquare size={20} className="header-icon" />
            <span>
              {quickView === "today" ? "Today's Tasks"
                : quickView === "overdue" ? "Overdue Tasks"
                : quickView === "upcoming" ? "Upcoming (7 days)"
                : "All Tasks"}
            </span>
          </h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="bulk-action-bar">
                <span className="bulk-count">{selectedIds.size} selected</span>
                <button className="btn btn-ghost btn-xs" onClick={handleBulkComplete}>
                  Complete All
                </button>
                <button className="btn btn-ghost btn-xs btn-danger" onClick={handleBulkDelete}>
                  Delete All
                </button>
                <button className="btn btn-ghost btn-xs" onClick={() => setSelectedIds(new Set())}>
                  Cancel
                </button>
              </div>
            )}
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => {
                if (viewMode === "calendar") {
                  loadTodosForMonth(calendarDate);
                } else {
                  loadTodosByQuickView(quickView);
                }
              }}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />

        <AddTodoForm onAdd={handleAddTodo} loading={loading} />

        <TodoList
          todos={todos}
          selectedDate={selectedDate}
          subtasks={subtasks}
          selectedIds={selectedIds}
          onToggle={handleToggleTodo}
          onDelete={handleDeleteTodo}
          onUpdate={handleUpdateTodo}
          onSubtaskCreate={handleSubtaskCreate}
          onSubtaskToggle={handleSubtaskToggle}
          onSubtaskUpdate={handleSubtaskUpdate}
          onSubtaskDelete={handleSubtaskDelete}
          onToggleSelect={handleToggleSelectTodo}
          loading={loading}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          calendarDate={calendarDate}
          onChangeMonth={(offset) => {
            setCalendarDate((prev) => {
              const next = new Date(prev);
              next.setUTCMonth(next.getUTCMonth() + offset);
              return next;
            });
          }}
          onSelectDate={(date) => setSelectedDate(date === "" ? null : date)}
        />
      </GlassCard>
    </div>
  );
};

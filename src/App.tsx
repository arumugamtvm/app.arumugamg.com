import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "./components/GlassCard";
import { StatusCard } from "./components/StatusCard";
import { AuthCard } from "./components/AuthCard";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoList } from "./components/TodoList";
import { LoginPanel } from "./components/LoginPanel";
import { NotesWorkspace } from "./components/NotesWorkspace";
import { McpWorkspace } from "./components/McpWorkspace";
import type { Todo, Subtask, RecurrenceRule, QuickViewFilter } from "./types";
import {
  fetchTodos as fetchTodosApi,
  fetchTodayTodos,
  fetchOverdueTodos,
  fetchUpcomingTodos,
  createTodo as createTodoApi,
  completeTodo as completeTodoApi,
  reopenTodo as reopenTodoApi,
  deleteTodo as deleteTodoApi,
  updateTodo as updateTodoApi,
  bulkCompleteTodos,
  bulkDeleteTodos,
  fetchSubtasksForTodos,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  fetchNotes,
  getJwtToken,
  decodeJwt,
  isTokenExpired,
  clearJwtToken,
} from "./api/todoApi";
import { CheckSquare, LogOut, User, FileText, Cpu, LayoutGrid, ArrowLeft, AlertTriangle, Clock, Calendar } from "lucide-react";
import "./App.css";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Dashboard Workspace selection state
  const [activeWorkspace, setActiveWorkspace] = useState<"dashboard" | "todos" | "notes" | "mcp">("dashboard");

  // Quick view filter (Today / Overdue / Upcoming / All)
  const [quickView, setQuickView] = useState<QuickViewFilter>("all");

  // Dashboard item metric counts
  const [openTasksCount, setOpenTasksCount] = useState<number | null>(null);
  const [overdueCount, setOverdueCount] = useState<number | null>(null);
  const [notesCount, setNotesCount] = useState<number | null>(null);

  // Calendar / view mode state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = getJwtToken();
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && !isTokenExpired(decoded)) {
        setIsAuthenticated(true);
        setUserEmail(decoded.email);
        return;
      }
    }
    setIsAuthenticated(false);
    setUserEmail("");
  }, [sessionKey]);

  const fetchSubtasksForLoadedTodos = async (todos: Todo[]): Promise<Subtask[]> => {
    try {
      return await fetchSubtasksForTodos(todos.map((t) => t.id));
    } catch {
      return [];
    }
  };

  const loadTodosByQuickView = useCallback(async (view: QuickViewFilter) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    try {
      let data: Todo[] = [];
      switch (view) {
        case "today":
          data = await fetchTodayTodos();
          break;
        case "overdue":
          data = await fetchOverdueTodos();
          break;
        case "upcoming":
          data = await fetchUpcomingTodos(7);
          break;
        default:
          data = await fetchTodosApi();
      }
      setTodos(data);
      setSubtasks(await fetchSubtasksForLoadedTodos(data));
      setOpenTasksCount(data.filter((t) => t.status === "open").length);
    } catch (e) {
      setTodos([]);
      const errMsg = (e as Error).message;
      if (errMsg === "UNAUTHORIZED") {
        setError("Unauthorized session. Please login again.");
        setIsAuthenticated(false);
      } else {
        setError(errMsg || "Failed to load tasks from API gateway.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const startOfMonthUTC = (d: Date): Date =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const endOfMonthUTC = (d: Date): Date =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

  const loadTodosForMonth = useCallback(
    async (date: Date) => {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);
      try {
        const startDate = isoDate(startOfMonthUTC(date));
        const endDate = isoDate(endOfMonthUTC(date));
        const data = await fetchTodosApi(undefined, startDate, endDate);
        setTodos(data);
        setSubtasks(await fetchSubtasksForLoadedTodos(data));
      } catch (e) {
        const errMsg = (e as Error).message;
        if (errMsg === "UNAUTHORIZED") {
          setError("Unauthorized session. Please login again.");
          setIsAuthenticated(false);
        } else {
          setError(errMsg || "Failed to load tasks from API gateway.");
        }
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const loadDashboardMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [tasks, overdue, notes] = await Promise.all([
        fetchTodosApi("open"),
        fetchOverdueTodos(),
        fetchNotes(),
      ]);
      setOpenTasksCount(tasks.length);
      setOverdueCount(overdue.length);
      setNotesCount(notes.length);
    } catch {
      // Silently catch metric errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeWorkspace === "todos") {
        if (viewMode === "calendar") {
          loadTodosForMonth(calendarDate);
        } else {
          loadTodosByQuickView(quickView);
        }
      } else if (activeWorkspace === "dashboard") {
        loadDashboardMetrics();
      }
    }
  }, [isAuthenticated, sessionKey, activeWorkspace, viewMode, calendarDate, quickView, loadTodosByQuickView, loadTodosForMonth, loadDashboardMetrics]);

  const handleQuickViewChange = (view: QuickViewFilter) => {
    setQuickView(view);
    setSelectedIds(new Set());
    setSelectedDate(null);
  };

  const handleAddTodo = async (
    title: string,
    priority: "low" | "normal" | "high",
    description?: string,
    dueDate?: string,
    recurrence?: RecurrenceRule,
    subtasks?: string[],
    labels?: string[],
  ) => {
    setError(null);
    try {
      await createTodoApi(title, priority, description, dueDate, recurrence, subtasks, labels);
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to add task.");
    }
  };

  const handleToggleTodo = async (id: number) => {
    setError(null);
    try {
      const todo = todos.find((t) => t.id === id);
      if (todo?.status === "done") {
        await reopenTodoApi(id);
      } else {
        await completeTodoApi(id);
      }
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to update task.");
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setError(null);
    try {
      await deleteTodoApi(id);
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to delete task.");
    }
  };

  const handleUpdateTodo = async (
    id: number,
    fields: {
      title?: string;
      priority?: "low" | "normal" | "high";
      description?: string;
      due_date?: string;
      recurrence?: RecurrenceRule | null;
      labels?: string[];
    }
  ) => {
    setError(null);
    try {
      await updateTodoApi(id, { ...fields, recurrence: fields.recurrence ?? undefined });
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to update task.");
    }
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────

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
    setError(null);
    try {
      await bulkCompleteTodos([...selectedIds]);
      setSelectedIds(new Set());
      await loadTodosByQuickView(quickView);
    } catch (e) {
      setError((e as Error).message || "Failed to bulk complete tasks.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected task(s)? This cannot be undone.`)) return;
    setError(null);
    try {
      await bulkDeleteTodos([...selectedIds]);
      setSelectedIds(new Set());
      await loadTodosByQuickView(quickView);
    } catch (e) {
      setError((e as Error).message || "Failed to bulk delete tasks.");
    }
  };

  // ── Subtask handlers ─────────────────────────────────────────────────────

  const handleSubtaskCreate = async (todoId: number, title: string) => {
    setError(null);
    try {
      await createSubtask(todoId, title);
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to create subtask.");
    }
  };

  const handleSubtaskToggle = async (id: number) => {
    setError(null);
    try {
      const current = subtasks.find((s) => s.id === id);
      const newStatus = current?.status === "done" ? "open" : "done";
      await updateSubtask(id, { status: newStatus });
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to toggle subtask.");
    }
  };

  const handleSubtaskUpdate = async (id: number, title: string) => {
    setError(null);
    try {
      await updateSubtask(id, { title });
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to update subtask.");
    }
  };

  const handleSubtaskDelete = async (id: number) => {
    setError(null);
    try {
      await deleteSubtask(id);
      if (viewMode === "calendar") {
        await loadTodosForMonth(calendarDate);
      } else {
        await loadTodosByQuickView(quickView);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to delete subtask.");
    }
  };

  const handleLogout = () => {
    clearJwtToken();
    setActiveWorkspace("dashboard");
    setSessionKey((k) => k + 1);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <main className="app-container auth-container">
        <LoginPanel onLoginSuccess={() => setSessionKey((k) => k + 1)} />
        <GlassCard className="health-check-card" delay="0.1s">
          <StatusCard />
        </GlassCard>
      </main>
    );
  }

  return (
    <main className={`app-container workspace-${activeWorkspace}`}>
      {/* ── Dashboard Top User Bar ── */}
      <div className="dashboard-global-header">
        <div className="user-badge">
          <User size={14} />
          <span>{userEmail}</span>
        </div>
        
        <div className="header-actions">
          {activeWorkspace !== "dashboard" && (
            <button className="btn btn-ghost btn-xs" onClick={() => setActiveWorkspace("dashboard")}>
              <LayoutGrid size={12} />
              <span>Launcher</span>
            </button>
          )}
          
          <button className="btn btn-ghost btn-xs logout-btn" onClick={handleLogout}>
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Dashboard ── */}
      {activeWorkspace === "dashboard" && (
        <div className="dashboard-grid-launcher">
          <GlassCard className="hero-card" glow={true} delay="0s">
            <h1 className="hero-title">arumugamg.com</h1>
            <p className="hero-subtitle">Unified Launchpad Gateway Dashboard</p>
            <StatusCard />
          </GlassCard>

          {/* Dashboard Metrics Bar */}
          {(overdueCount !== null && overdueCount > 0) && (
            <div className="overdue-alert-bar">
              <AlertTriangle size={14} />
              <span>You have <strong>{overdueCount}</strong> overdue task{overdueCount !== 1 ? "s" : ""}</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => { setActiveWorkspace("todos"); handleQuickViewChange("overdue"); }}
              >
                View →
              </button>
            </div>
          )}

          {/* Launcher Grid */}
          <div className="launcher-grid">
            <div className="launcher-card" onClick={() => setActiveWorkspace("todos")}>
              <div className="launcher-card-icon text-accent">
                <CheckSquare size={28} />
              </div>
              <div className="launcher-card-body">
                <h3>Task Workspace</h3>
                <p>Manage personal tasks, priorities, labels and recurrence rules with Todoist-inspired smart views.</p>
                <div className="card-metrics-row">
                  <span className="metric-badge">
                    {openTasksCount !== null ? `${openTasksCount} active` : "Open Tasks"}
                  </span>
                  {overdueCount !== null && overdueCount > 0 && (
                    <span className="metric-badge metric-badge-danger">{overdueCount} overdue</span>
                  )}
                  <span className="action-link">Open &rarr;</span>
                </div>
              </div>
            </div>

            <div className="launcher-card" onClick={() => setActiveWorkspace("notes")}>
              <div className="launcher-card-icon text-violet">
                <FileText size={28} />
              </div>
              <div className="launcher-card-body">
                <h3>Notes Workspace</h3>
                <p>Write, view, and organize secure markdown personal notes with live database persistence.</p>
                <div className="card-metrics-row">
                  <span className="metric-badge">
                    {notesCount !== null ? `${notesCount} saved notes` : "Notes"}
                  </span>
                  <span className="action-link">Open &rarr;</span>
                </div>
              </div>
            </div>

            <div className="launcher-card" onClick={() => setActiveWorkspace("mcp")}>
              <div className="launcher-card-icon text-cyan">
                <Cpu size={28} />
              </div>
              <div className="launcher-card-body">
                <h3>MCP Server Hub</h3>
                <p>Diagnostic tools, latency checkers, and tool schemas for your Model Context Protocol gateway.</p>
                <div className="card-metrics-row">
                  <span className="metric-badge">mcp.arumugamg.com</span>
                  <span className="action-link">Configure &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Todos Workspace ── */}
      {activeWorkspace === "todos" && (
        <div className="todos-workspace-layout">
          <div className="workspace-header-row margin-bottom">
            <button className="btn btn-ghost btn-sm back-btn" onClick={() => setActiveWorkspace("dashboard")}>
              <ArrowLeft size={14} />
              <span>Dashboard Launcher</span>
            </button>
            <span className="workspace-badge">Task Workspace</span>
          </div>

          <AuthCard onTokenChange={() => setSessionKey((k) => k + 1)} />

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

            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}

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
      )}

      {activeWorkspace === "notes" && (
        <NotesWorkspace onBackToDashboard={() => setActiveWorkspace("dashboard")} />
      )}

      {activeWorkspace === "mcp" && (
        <McpWorkspace onBackToDashboard={() => setActiveWorkspace("dashboard")} />
      )}
    </main>
  );
}

export default App;

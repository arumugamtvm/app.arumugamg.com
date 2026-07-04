import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "./components/GlassCard";
import { StatusCard } from "./components/StatusCard";
import { AuthCard } from "./components/AuthCard";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoList } from "./components/TodoList";
import { LoginPanel } from "./components/LoginPanel";
import { NotesWorkspace } from "./components/NotesWorkspace";
import { McpWorkspace } from "./components/McpWorkspace";
import type { Todo } from "./types";
import {
  fetchTodos as fetchTodosApi,
  createTodo as createTodoApi,
  completeTodo as completeTodoApi,
  deleteTodo as deleteTodoApi,
  fetchNotes,
  getJwtToken,
  decodeJwt,
  isTokenExpired,
  clearJwtToken,
} from "./api/todoApi";
import { CheckSquare, LogOut, User, FileText, Cpu, LayoutGrid, ArrowLeft } from "lucide-react";
import "./App.css";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0); // Trigger reload of state on login/logout
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Dashboard Workspace selection state
  const [activeWorkspace, setActiveWorkspace] = useState<"dashboard" | "todos" | "notes" | "mcp">("dashboard");

  // Dashboard item metric counts
  const [openTasksCount, setOpenTasksCount] = useState<number | null>(null);
  const [notesCount, setNotesCount] = useState<number | null>(null);

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

  const loadTodos = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodosApi();
      setTodos(data);
      // Update open task count metrics
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

  const loadDashboardMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const tasks = await fetchTodosApi("open");
      setOpenTasksCount(tasks.length);

      const notes = await fetchNotes();
      setNotesCount(notes.length);
    } catch {
      // Silently catch metric errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeWorkspace === "todos") {
        loadTodos();
      } else if (activeWorkspace === "dashboard") {
        loadDashboardMetrics();
      }
    }
  }, [isAuthenticated, sessionKey, activeWorkspace, loadTodos, loadDashboardMetrics]);

  const handleAddTodo = async (title: string, priority: "low" | "normal" | "high") => {
    setError(null);
    try {
      await createTodoApi(title, priority);
      await loadTodos();
    } catch (e) {
      setError((e as Error).message || "Failed to add task.");
    }
  };

  const handleToggleTodo = async (id: number) => {
    setError(null);
    try {
      await completeTodoApi(id);
      await loadTodos();
    } catch (e) {
      setError((e as Error).message || "Failed to complete task.");
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setError(null);
    try {
      await deleteTodoApi(id);
      await loadTodos();
    } catch (e) {
      setError((e as Error).message || "Failed to delete task.");
    }
  };

  const handleLogout = () => {
    clearJwtToken();
    setActiveWorkspace("dashboard");
    setSessionKey((k) => k + 1);
  };

  if (!isAuthenticated) {
    return (
      <main className="app-container">
        {/* Auth Lock Screen Panel */}
        <LoginPanel onLoginSuccess={() => setSessionKey((k) => k + 1)} />

        {/* API connection checker tool */}
        <GlassCard className="health-check-card" delay="0.1s">
          <StatusCard />
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="app-container">
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

      {/* ── Conditionally Render Active Workspace ── */}
      {activeWorkspace === "dashboard" && (
        <div className="dashboard-grid-launcher">
          <GlassCard className="hero-card" glow={true} delay="0s">
            <h1 className="hero-title">arumugamg.com</h1>
            <p className="hero-subtitle">Unified Launchpad Gateway Dashboard</p>
            
            {/* Connection status verify tool */}
            <StatusCard />
          </GlassCard>

          {/* Launcher Grid */}
          <div className="launcher-grid">
            {/* Task Workspace Card */}
            <div className="launcher-card" onClick={() => setActiveWorkspace("todos")}>
              <div className="launcher-card-icon text-accent">
                <CheckSquare size={28} />
              </div>
              <div className="launcher-card-body">
                <h3>Task Workspace</h3>
                <p>Manage personal tasks, completion statuses, and priorities on your unified SQL database.</p>
                <div className="card-metrics-row">
                  <span className="metric-badge">
                    {openTasksCount !== null ? `${openTasksCount} active tasks` : "Open Tasks"}
                  </span>
                  <span className="action-link">Open &rarr;</span>
                </div>
              </div>
            </div>

            {/* Notes Workspace Card */}
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

            {/* MCP Hub Card */}
            <div className="launcher-card" onClick={() => setActiveWorkspace("mcp")}>
              <div className="launcher-card-icon text-cyan">
                <Cpu size={28} />
              </div>
              <div className="launcher-card-body">
                <h3>MCP Server Hub</h3>
                <p>Diagnostic tools, latency latency checkers, and tool schemas for your Model Context Protocol gateway.</p>
                <div className="card-metrics-row">
                  <span className="metric-badge">mcp.arumugamg.com</span>
                  <span className="action-link">Configure &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeWorkspace === "todos" && (
        <div className="todos-workspace-layout">
          {/* Header breadcrumb row */}
          <div className="workspace-header-row margin-bottom">
            <button className="btn btn-ghost btn-sm back-btn" onClick={() => setActiveWorkspace("dashboard")}>
              <ArrowLeft size={14} />
              <span>Dashboard Launcher</span>
            </button>
            <span className="workspace-badge">Task Workspace</span>
          </div>

          {/* Session verification configs */}
          <AuthCard onTokenChange={() => setSessionKey((k) => k + 1)} />

          {/* Todo Workspace */}
          <GlassCard className="todos-card" delay="0.15s">
            <div className="section-header">
              <h2 className="section-title">
                <CheckSquare size={20} className="header-icon" />
                <span>Workspace Operations</span>
              </h2>
              <button
                className="btn btn-ghost btn-xs"
                onClick={loadTodos}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}

            {/* Input adding form */}
            <AddTodoForm onAdd={handleAddTodo} loading={loading} />

            {/* Task list board */}
            <TodoList
              todos={todos}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
              loading={loading}
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

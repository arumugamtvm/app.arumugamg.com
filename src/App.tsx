import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "./components/GlassCard";
import { StatusCard } from "./components/StatusCard";
import { AuthCard } from "./components/AuthCard";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoList } from "./components/TodoList";
import { LoginPanel } from "./components/LoginPanel";
import type { Todo } from "./types";
import {
  fetchTodos as fetchTodosApi,
  createTodo as createTodoApi,
  completeTodo as completeTodoApi,
  deleteTodo as deleteTodoApi,
  getJwtToken,
  decodeJwt,
  isTokenExpired,
  clearJwtToken,
} from "./api/todoApi";
import { CheckSquare, LogOut, User } from "lucide-react";
import "./App.css";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0); // Trigger reload of state on login/logout
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

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

  useEffect(() => {
    if (isAuthenticated) {
      loadTodos();
    }
  }, [isAuthenticated, sessionKey, loadTodos]);

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
      {/* ── Dashboard Header ── */}
      <GlassCard className="hero-card" glow={true} delay="0s">
        <div className="dashboard-user-row">
          <div className="user-badge">
            <User size={14} />
            <span>{userEmail}</span>
          </div>
          
          <button className="btn btn-ghost btn-xs logout-btn" onClick={handleLogout}>
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>

        <h1 className="hero-title">arumugamg.com</h1>
        <p className="hero-subtitle">Secure Gateway · Realtime Todo Management</p>
        
        {/* Connection status verify tool */}
        <StatusCard />
      </GlassCard>

      {/* ── Advanced Session Configuration ── */}
      <AuthCard onTokenChange={() => setSessionKey((k) => k + 1)} />

      {/* ── Todo Workspace ── */}
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
    </main>
  );
}

export default App;

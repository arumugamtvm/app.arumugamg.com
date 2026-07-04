import { useState, useEffect } from "react";
import { GlassCard } from "./components/GlassCard";
import { StatusCard } from "./components/StatusCard";
import { AuthCard } from "./components/AuthCard";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoList } from "./components/TodoList";
import type { Todo } from "./types";
import {
  fetchTodos as fetchTodosApi,
  createTodo as createTodoApi,
  completeTodo as completeTodoApi,
  deleteTodo as deleteTodoApi,
} from "./api/todoApi";
import { CheckSquare } from "lucide-react";
import "./App.css";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0); // Trigger reload of state on login/logout

  const loadTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodosApi();
      setTodos(data);
    } catch (e) {
      setTodos([]);
      const errMsg = (e as Error).message;
      if (errMsg === "UNAUTHORIZED") {
        setError("Unauthorized session. Please configure a valid JWT access token above.");
      } else {
        setError(errMsg || "Failed to load tasks from API gateway.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [sessionKey]);

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

  return (
    <main className="app-container">
      {/* ── Header ── */}
      <GlassCard className="hero-card" glow={true} delay="0s">
        <h1 className="hero-title">arumugamg.com</h1>
        <p className="hero-subtitle">Secure Gateway · Realtime Todo Management</p>
        
        {/* Connection status verify tool */}
        <StatusCard />
      </GlassCard>

      {/* ── Session Configuration ── */}
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

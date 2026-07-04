import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'https://api.arumugamg.com'

// In a real app this token would come from an auth flow (OTP → JWT).
// For now we read it from localStorage so tests / manual usage can inject it.
function getToken(): string {
  return localStorage.getItem('jwt_token') ?? ''
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

interface Todo {
  id: string
  title: string
  completed: boolean
}

function App() {
  const [status, setStatus] = useState<string>('---')
  const [statusLoading, setStatusLoading] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])
  const [todosLoading, setTodosLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ── /status ──────────────────────────────────────────────────────────────
  const checkStatus = async () => {
    setStatusLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/status`, { headers: authHeaders() })
      const data = await res.json()
      setStatus(JSON.stringify(data, null, 2))
    } catch {
      setStatus('Error reaching API')
      setError('Could not reach API /status')
    } finally {
      setStatusLoading(false)
    }
  }

  // ── /todos ────────────────────────────────────────────────────────────────
  const fetchTodos = async () => {
    setTodosLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/todos`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Todo[] = await res.json()
      setTodos(data)
    } catch (e) {
      setError(`Failed to load todos: ${(e as Error).message}`)
    } finally {
      setTodosLoading(false)
    }
  }

  const addTodo = async () => {
    if (!newTitle.trim()) return
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setNewTitle('')
      await fetchTodos()
    } catch (e) {
      setError(`Failed to add todo: ${(e as Error).message}`)
    }
  }

  const toggleTodo = async (todo: Todo) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${todo.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ completed: !todo.completed }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchTodos()
    } catch (e) {
      setError(`Failed to update todo: ${(e as Error).message}`)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchTodos()
    } catch (e) {
      setError(`Failed to delete todo: ${(e as Error).message}`)
    }
  }

  // Load todos on mount
  useEffect(() => {
    fetchTodos()
  }, [])

  return (
    <main className="app-container">
      {/* ── Hero / Status Card ── */}
      <section className="glass-card hero-card">
        <div className="hero-glow" aria-hidden="true" />
        <h1 className="hero-title">arumugamg.com</h1>
        <p className="hero-subtitle">Premium front‑end · Cloudflare Worker API</p>

        <div className="status-row">
          <button
            id="check-status-btn"
            className="btn btn-primary"
            onClick={checkStatus}
            disabled={statusLoading}
          >
            {statusLoading ? <span className="spinner" /> : '⚡ Check API Status'}
          </button>
          <pre className="output-box" aria-live="polite">
            {status}
          </pre>
        </div>
      </section>

      {/* ── Todos Card ── */}
      <section className="glass-card todos-card">
        <h2 className="section-title">My Todos</h2>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="add-row">
          <input
            id="new-todo-input"
            className="todo-input"
            type="text"
            placeholder="What needs doing?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <button id="add-todo-btn" className="btn btn-accent" onClick={addTodo}>
            + Add
          </button>
        </div>

        {todosLoading ? (
          <div className="loader-row">
            <span className="spinner large" />
          </div>
        ) : todos.length === 0 ? (
          <p className="empty-state">No todos yet. Add one above!</p>
        ) : (
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className={`todo-item${todo.completed ? ' done' : ''}`}>
                <button
                  className="todo-check"
                  aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                  onClick={() => toggleTodo(todo)}
                >
                  {todo.completed ? '✅' : '○'}
                </button>
                <span className="todo-title">{todo.title}</span>
                <button
                  className="todo-delete"
                  aria-label={`Delete ${todo.title}`}
                  onClick={() => deleteTodo(todo.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          id="refresh-todos-btn"
          className="btn btn-ghost"
          onClick={fetchTodos}
          disabled={todosLoading}
        >
          ↺ Refresh
        </button>
      </section>
    </main>
  )
}

export default App

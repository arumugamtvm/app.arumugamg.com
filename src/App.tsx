import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { TodoWorkspace } from "./components/TodoWorkspace";
import { NotesWorkspace } from "./components/NotesWorkspace";
import { McpWorkspace } from "./components/McpWorkspace";
import { BlogsWorkspace } from "./components/BlogsWorkspace";
import { LoginPanel } from "./components/LoginPanel";
import { GlassCard } from "./components/GlassCard";
import { StatusCard } from "./components/StatusCard";
import { ThemeToggle } from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";
import { getJwtToken, decodeJwt, isTokenExpired, clearJwtToken, fetchOverdueTodos } from "./api/todoApi";

import {
  CheckSquare,
  FileText,
  Cpu,
  BookOpen,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import "./App.css";

function Dashboard() {
  const [overdueCount, setOverdueCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverdueTodos()
      .then((od) => setOverdueCount(od.length))
      .catch(() => setOverdueCount(null));
  }, []);

  return (
    <div className="dashboard-grid-launcher">
      <GlassCard className="hero-card" glow={true} delay="0s">
        <div className="hero-brand-row">
          <div className="hero-brand-logo" aria-hidden="true" />
          <div className="hero-brand-text">
            <p className="hero-eyebrow">Personal workspace</p>
            <h1 className="hero-title">arumugamg.com</h1>
            <p className="hero-subtitle">Tasks, notes, MCP, and publishing — one gateway.</p>
          </div>
        </div>
        <StatusCard />
      </GlassCard>

      {(overdueCount !== null && overdueCount > 0) && (
        <div className="overdue-alert-bar">
          <AlertTriangle size={14} />
          <span>You have <strong>{overdueCount}</strong> overdue task{overdueCount !== 1 ? "s" : ""}</span>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => navigate("/todos?view=overdue")}
          >
            View →
          </button>
        </div>
      )}

      <div className="launcher-section">
        <div className="launcher-section-label">
          <span>Workspaces</span>
          <span className="launcher-section-hint">Select a tool to continue</span>
        </div>

        <div className="launcher-grid">
          <Link to="/todos" className="launcher-card" style={{ animationDelay: "0.05s" }}>
            <div className="launcher-card-icon icon-accent text-accent">
              <CheckSquare size={22} />
            </div>
            <div className="launcher-card-body">
              <h3>Tasks</h3>
              <p>Priorities, labels, recurrence, and smart views for day-to-day work.</p>
              <div className="card-metrics-row">
                <span className="metric-badge">Tasks</span>
                {overdueCount !== null && overdueCount > 0 && (
                  <span className="metric-badge metric-badge-danger">{overdueCount} overdue</span>
                )}
                <span className="action-link">Open →</span>
              </div>
            </div>
          </Link>

          <Link to="/notes" className="launcher-card" style={{ animationDelay: "0.1s" }}>
            <div className="launcher-card-icon icon-violet text-violet">
              <FileText size={22} />
            </div>
            <div className="launcher-card-body">
              <h3>Notes</h3>
              <p>Markdown notes with live persistence, pinning, and split preview.</p>
              <div className="card-metrics-row">
                <span className="metric-badge">Notes</span>
                <span className="action-link">Open →</span>
              </div>
            </div>
          </Link>

          <Link to="/mcp" className="launcher-card" style={{ animationDelay: "0.15s" }}>
            <div className="launcher-card-icon icon-cyan text-cyan">
              <Cpu size={22} />
            </div>
            <div className="launcher-card-body">
              <h3>MCP Hub</h3>
              <p>Gateway diagnostics, latency checks, and tool schema reference.</p>
              <div className="card-metrics-row">
                <span className="metric-badge">MCP</span>
                <span className="action-link">Open →</span>
              </div>
            </div>
          </Link>

          <Link to="/blogs" className="launcher-card" style={{ animationDelay: "0.2s" }}>
            <div className="launcher-card-icon icon-pink text-pink">
              <BookOpen size={22} />
            </div>
            <div className="launcher-card-body">
              <h3>Blogs</h3>
              <p>Draft, preview, and publish articles to blog.arumugamg.com.</p>
              <div className="card-metrics-row">
                <span className="metric-badge">Publishing</span>
                <span className="action-link">Manage →</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { preference, cycle } = useTheme();

  useEffect(() => {
    const checkAuth = () => {
      const token = getJwtToken();
      if (!token) return false;
      const decoded = decodeJwt(token);
      if (!decoded) return false;
      if (!isTokenExpired(decoded)) {
        setUserEmail(decoded.email);
        return true;
      }
      return false;
    };
    setIsAuthenticated(checkAuth());
  }, [sessionKey]);

  const handleLogout = () => {
    clearJwtToken();
    setSessionKey((k) => k + 1);
    navigate("/");
  };

  let containerClass = "app-container";
  if (location.pathname === "/") containerClass += " workspace-dashboard";
  else if (location.pathname === "/todos") containerClass += " workspace-todos";
  else if (location.pathname === "/notes") containerClass += " workspace-notes";
  else if (location.pathname === "/mcp") containerClass += " workspace-mcp";
  else if (location.pathname === "/blogs") containerClass += " workspace-blogs";

  if (!isAuthenticated) {
    return (
      <main className="app-container app-login-layout">
        <div className="login-theme-floating">
          <ThemeToggle preference={preference} onCycle={cycle} />
        </div>
        <LoginPanel onLoginSuccess={() => setSessionKey((k) => k + 1)} />
      </main>
    );
  }

  return (
    <main className={containerClass}>
      <header className="dashboard-global-header">
        <button
          type="button"
          className="header-brand"
          onClick={() => navigate("/")}
          aria-label="Go to dashboard"
        >
          <div className="brand-logo" aria-hidden="true" />
          <span className="brand-text">A.G Gateway</span>
        </button>
        <div className="header-actions">
          <ThemeToggle preference={preference} onCycle={cycle} />
          {userEmail && (
            <span className="user-email-display" title={userEmail}>
              {userEmail}
            </span>
          )}
          <button className="btn btn-ghost btn-xs logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            <span className="logout-label">Sign Out</span>
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/todos"
          element={
            <TodoWorkspace
              onBackToDashboard={() => navigate("/")}
              sessionKey={sessionKey}
              onTokenChange={() => setSessionKey((k) => k + 1)}
            />
          }
        />
        <Route path="/notes" element={<NotesWorkspace onBackToDashboard={() => navigate("/")} />} />
        <Route path="/mcp" element={<McpWorkspace onBackToDashboard={() => navigate("/")} />} />
        <Route path="/blogs" element={<BlogsWorkspace onBackToDashboard={() => navigate("/")} />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

export default App;

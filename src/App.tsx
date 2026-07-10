import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { TodoWorkspace } from "./components/TodoWorkspace";
import { NotesWorkspace } from "./components/NotesWorkspace";
import { McpWorkspace } from "./components/McpWorkspace";
import { BlogsWorkspace } from "./components/BlogsWorkspace";
import { LoginPanel } from "./components/LoginPanel";
import { GlassCard } from "./components/GlassCard";
import { StatusCard } from "./components/StatusCard";
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
        <h1 className="hero-title">arumugamg.com</h1>
        <p className="hero-subtitle">Unified Launchpad Gateway Dashboard</p>
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

      <div className="launcher-grid">
        <Link to="/todos" className="launcher-card" style={{ textDecoration: 'none' }}>
          <div className="launcher-card-icon text-accent">
            <CheckSquare size={28} />
          </div>
          <div className="launcher-card-body">
            <h3>Task Workspace</h3>
            <p>Manage personal tasks, priorities, labels and recurrence rules with Todoist-inspired smart views.</p>
            <div className="card-metrics-row">
              <span className="metric-badge">Open Tasks</span>
              {overdueCount !== null && overdueCount > 0 && (
                <span className="metric-badge metric-badge-danger">{overdueCount} overdue</span>
              )}
              <span className="action-link">Open &rarr;</span>
            </div>
          </div>
        </Link>

        <Link to="/notes" className="launcher-card" style={{ textDecoration: 'none' }}>
          <div className="launcher-card-icon text-violet">
            <FileText size={28} />
          </div>
          <div className="launcher-card-body">
            <h3>Notes Workspace</h3>
            <p>Write, view, and organize secure markdown personal notes with live database persistence.</p>
            <div className="card-metrics-row">
              <span className="metric-badge">Notes</span>
              <span className="action-link">Open &rarr;</span>
            </div>
          </div>
        </Link>

        <Link to="/mcp" className="launcher-card" style={{ textDecoration: 'none' }}>
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
        </Link>

        <Link to="/blogs" className="launcher-card" style={{ textDecoration: 'none' }}>
          <div className="launcher-card-icon" style={{ color: "#ec4899" }}>
            <BookOpen size={28} />
          </div>
          <div className="launcher-card-body">
            <h3>Blogs Manager</h3>
            <p>Write, edit, preview and publish developer articles to blog.arumugamg.com with markdown support.</p>
            <div className="card-metrics-row">
              <span className="metric-badge">blog.arumugamg.com</span>
              <span className="action-link">Manage &rarr;</span>
            </div>
          </div>
        </Link>
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
        <LoginPanel onLoginSuccess={() => setSessionKey((k) => k + 1)} />
      </main>
    );
  }

  return (
    <main className={containerClass}>
      <div className="dashboard-global-header">
        <div className="header-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <div className="brand-logo" />
          <span className="brand-text">A.G Gateway</span>
        </div>
        <div className="header-actions">
          {userEmail && <span className="user-email-display">{userEmail}</span>}
          <button className="btn btn-ghost btn-xs logout-btn" onClick={handleLogout}>
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

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

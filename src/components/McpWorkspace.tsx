import React, { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Activity, Cpu, Server } from "lucide-react";

interface McpWorkspaceProps {
  onBackToDashboard: () => void;
}

export const McpWorkspace: React.FC<McpWorkspaceProps> = ({ onBackToDashboard }) => {
  const [healthStatus, setHealthStatus] = useState<"online" | "offline" | "checking">("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pingTime, setPingTime] = useState<number | null>(null);

  const checkMcpHealth = async () => {
    setHealthStatus("checking");
    setErrorMsg(null);
    const start = Date.now();
    try {
      const res = await fetch("https://mcp.arumugamg.com/health");
      if (res.ok) {
        setHealthStatus("online");
        setPingTime(Date.now() - start);
      } else {
        throw new Error(`HTTP Error ${res.status}`);
      }
    } catch (err) {
      setHealthStatus("offline");
      setPingTime(null);
      setErrorMsg((err as Error).message || "Could not ping mcp.arumugamg.com");
    }
  };

  useEffect(() => {
    checkMcpHealth();
  }, []);

  return (
    <div className="mcp-workspace-container">
      {/* Back to Launcher Breadcrumb */}
      <div className="workspace-header-row">
        <button className="btn btn-ghost btn-sm back-btn" onClick={onBackToDashboard}>
          <ArrowLeft size={14} />
          <span>Dashboard Launcher</span>
        </button>
        <span className="workspace-badge">MCP Server Hub</span>
      </div>

      <div className="mcp-grid-layout">
        {/* Connection Diagnostics Card */}
        <div className="mcp-card">
          <div className="mcp-card-header">
            <Activity size={18} className="header-icon text-accent" />
            <h3>Gateway Health Diagnostics</h3>
            <button className="btn btn-ghost btn-xs btn-icon" onClick={checkMcpHealth} disabled={healthStatus === "checking"}>
              <RefreshCw size={14} className={healthStatus === "checking" ? "spin-animation" : ""} />
            </button>
          </div>

          <div className="mcp-diagnostic-indicator">
            {healthStatus === "checking" && (
              <div className="indicator-row checking">
                <span className="spinner" />
                <span>Pinging gateway server...</span>
              </div>
            )}
            {healthStatus === "online" && (
              <div className="indicator-row online">
                <div className="status-dot green-dot" />
                <div className="indicator-details">
                  <span className="status-label">ONLINE / SECURE</span>
                  <span className="ping-value">Latency: {pingTime}ms</span>
                </div>
              </div>
            )}
            {healthStatus === "offline" && (
              <div className="indicator-row offline">
                <div className="status-dot red-dot" />
                <div className="indicator-details">
                  <span className="status-label">OFFLINE / UNREACHABLE</span>
                  <span className="error-text">{errorMsg}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Server Config Details */}
        <div className="mcp-card">
          <div className="mcp-card-header">
            <Server size={18} className="header-icon text-violet" />
            <h3>Server Environment Profiles</h3>
          </div>
          <div className="mcp-details-list">
            <div className="detail-row">
              <span className="detail-label">Endpoint URL:</span>
              <span className="detail-val font-mono">https://mcp.arumugamg.com/mcp</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Identity Issuer:</span>
              <span className="detail-val font-mono">https://mcp.arumugamg.com</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Target DB Instance:</span>
              <span className="detail-val text-green font-mono">arumugamg-todos (Consolidated)</span>
            </div>
          </div>
        </div>

        {/* Available MCP Tools Checklist */}
        <div className="mcp-card full-width-card">
          <div className="mcp-card-header">
            <Cpu size={18} className="header-icon text-cyan" />
            <h3>Registered Agent-Facing Tools</h3>
          </div>
          <p className="section-description">
            Your AI assistants (e.g. Claude Desktop) call these schema-validated tools dynamically via the Model Context Protocol:
          </p>
          <div className="tools-list-grid">
            <div className="tool-item">
              <div className="tool-meta">
                <span className="tool-name">list_todos</span>
                <span className="tool-type">Read-Only</span>
              </div>
              <p className="tool-desc">Queries the SQL database and returns JSON tasks filtered optionally by status.</p>
            </div>
            
            <div className="tool-item">
              <div className="tool-meta">
                <span className="tool-name">create_todo</span>
                <span className="tool-type writable">Write-Only</span>
              </div>
              <p className="tool-desc">Appends a new task with customizable title, optional description, and priority levels (low/normal/high).</p>
            </div>

            <div className="tool-item">
              <div className="tool-meta">
                <span className="tool-name">update_todo</span>
                <span className="tool-type writable">Write-Only</span>
              </div>
              <p className="tool-desc">Modifies properties (title, description, priority, or status) of a todo by its numeric ID.</p>
            </div>

            <div className="tool-item">
              <div className="tool-meta">
                <span className="tool-name">complete_todo</span>
                <span className="tool-type writable">Write-Only</span>
              </div>
              <p className="tool-desc">Updates status column matching the specified ID parameter to 'done'.</p>
            </div>

            <div className="tool-item">
              <div className="tool-meta">
                <span className="tool-name">delete_todo</span>
                <span className="tool-type writable">Write-Only</span>
              </div>
              <p className="tool-desc">Removes task matching the specified numerical ID parameter permanently.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { getApiStatus } from "../api/todoApi";
import type { ApiStatus } from "../types";
import { Activity, ShieldAlert, CheckCircle } from "lucide-react";

export const StatusCard: React.FC = () => {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getApiStatus();
      setStatus(data);
    } catch {
      setStatus(null);
      setError("Unable to connect to Cloudflare Worker backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-section">
      <div className="status-header">
        <div className="status-title">
          <Activity className="icon" size={18} />
          <span>API Gateway Status</span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={checkStatus}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : "Verify Connection"}
        </button>
      </div>

      {status && (
        <div className="status-indicator success-indicator">
          <CheckCircle size={16} className="status-icon" />
          <div className="status-info">
            <span className="status-badge live">ONLINE</span>
            <span className="status-time">
              Pinged at {new Date(status.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="status-indicator error-indicator">
          <ShieldAlert size={16} className="status-icon" />
          <div className="status-info">
            <span className="status-badge offline">OFFLINE</span>
            <span className="status-message">{error}</span>
          </div>
        </div>
      )}

      {!status && !error && (
        <div className="status-indicator idle-indicator">
          <div className="status-dot" />
          <span className="status-text">Not verified yet. Click above to test connection.</span>
        </div>
      )}
    </div>
  );
};

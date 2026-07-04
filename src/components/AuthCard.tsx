import React, { useState, useEffect } from "react";
import {
  getJwtToken,
  setJwtToken,
  clearJwtToken,
  decodeJwt,
  isTokenExpired,
} from "../api/todoApi";
import type { DecodedToken } from "../types";
import { KeyRound, ShieldCheck, ShieldAlert, LogOut } from "lucide-react";

interface AuthCardProps {
  onTokenChange: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onTokenChange }) => {
  const [tokenInput, setTokenInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadTokenDetails = () => {
    const token = getJwtToken();
    setTokenInput(token);
    if (token) {
      const decodedData = decodeJwt(token);
      setDecoded(decodedData);
      if (decodedData) {
        setIsExpired(isTokenExpired(decodedData));
      }
    } else {
      setDecoded(null);
      setIsExpired(false);
    }
  };

  useEffect(() => {
    loadTokenDetails();
  }, []);

  const handleSave = () => {
    setJwtToken(tokenInput);
    loadTokenDetails();
    onTokenChange();
    setShowSettings(false);
  };

  const handleClear = () => {
    clearJwtToken();
    setTokenInput("");
    setDecoded(null);
    setIsExpired(false);
    onTokenChange();
  };

  const formatExpiry = (exp?: number) => {
    if (!exp) return "N/A";
    const date = new Date(exp * 1000);
    return date.toLocaleString();
  };

  const isAuthenticated = decoded && !isExpired;

  return (
    <div className="auth-card-container">
      {/* ── Status Banner ── */}
      <div
        className={`auth-status-banner ${
          isAuthenticated ? "status-authenticated" : "status-unauthenticated"
        }`}
        onClick={() => setShowSettings(!showSettings)}
      >
        <div className="banner-left">
          {isAuthenticated ? (
            <ShieldCheck size={18} className="auth-icon" />
          ) : (
            <ShieldAlert size={18} className="auth-icon" />
          )}
          <span className="auth-status-text">
            {isAuthenticated
              ? `Session Active: ${decoded.email}`
              : "Backend Session Offline (JWT Required)"}
          </span>
        </div>
        <button className="btn btn-ghost btn-xs banner-toggle-btn">
          {showSettings ? "Hide Settings" : "Configure Access"}
        </button>
      </div>

      {/* ── Collapsible Configuration Details ── */}
      {showSettings && (
        <div className="auth-config-drawer">
          {!isAuthenticated && (
            <div className="auth-alert-message">
              <p>
                Session is unauthenticated. Please sign in using the login screen.
              </p>
            </div>
          )}

          {decoded && (
            <div className="token-details">
              <div className="detail-item">
                <span className="detail-label">Identity:</span>
                <span className="detail-val">{decoded.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expires:</span>
                <span className={`detail-val ${isExpired ? "text-error" : ""}`}>
                  {formatExpiry(decoded.exp)}
                  {isExpired && " (Expired)"}
                </span>
              </div>
            </div>
          )}

          <div className="token-input-row">
            <div className="input-with-icon">
              <KeyRound size={16} className="input-icon" />
              <input
                type="text"
                className="token-input"
                placeholder="Paste Bearer JWT Token..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            <div className="action-buttons">
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Save Session
              </button>
              {getJwtToken() && (
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={handleClear}
                  title="Clear Session / Logout"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { generatePKCE, requestOtp, verifyOtp, exchangeCodeForToken } from "../api/authApi";
import type { PkcePair } from "../api/authApi";
import { setJwtToken } from "../api/todoApi";
import { GlassCard } from "./GlassCard";
import { Mail, ShieldCheck, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { ErrorBanner } from "./ui/ErrorBanner";

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pkce, setPkce] = useState<PkcePair | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cool down timer for resending OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Generate PKCE pair
      const pkcePair = await generatePKCE();
      setPkce(pkcePair);

      // 2. Request OTP code from auth server
      await requestOtp(email.trim());
      
      setSuccessMsg("Verification code successfully sent to your inbox.");
      setStep("verify");
      setResendCooldown(30); // 30s resend cooldown
    } catch (err) {
      setError((err as Error).message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !pkce || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Verify code and extract auth code
      const authCode = await verifyOtp(email.trim(), otpCode.trim(), pkce.challenge);

      // 2. Exchange auth code and verifier for JWT token
      const accessToken = await exchangeCodeForToken(authCode, pkce.verifier);

      // 3. Save access token in localStorage
      setJwtToken(accessToken);

      // 4. Trigger reload
      onLoginSuccess();
    } catch (err) {
      setError((err as Error).message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep("email");
    setOtpCode("");
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="login-panel-container">
      <GlassCard className="login-card" glow={true} delay="0s">
        <div className="login-header">
          <div className="lock-icon-container">
            <ShieldCheck size={28} className="lock-icon" />
          </div>
          <h1 className="login-title">Secure Portal</h1>
          <p className="login-subtitle">Email One-Time Password Authentication</p>
        </div>

        <ErrorBanner message={error} />

        {successMsg && (
          <div className="success-banner" role="alert">
            {successMsg}
          </div>
        )}

        {step === "email" ? (
          /* ── STEP 1: Input Email ── */
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="input-group-vertical">
              <label className="input-label">Authorized Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="login-input"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <span>Send OTP Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── STEP 2: Input Verification Code ── */
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="input-group-vertical">
              <label className="input-label">Enter 6-Digit Verification Code</label>
              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon" />
                <input
                  type="text"
                  className="login-input code-input"
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="login-action-row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleGoBack}
                disabled={loading}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleSendOtp}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-accent login-submit-btn"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? <span className="spinner" /> : <span>Verify & Access Workspace</span>}
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { generatePKCE, requestOtp, verifyOtp, exchangeCodeForToken, DEFAULT_EMAIL } from "../api/authApi";
import type { PkcePair } from "../api/authApi";
import { setJwtToken } from "../api/todoApi";
import { GlassCard } from "./GlassCard";
import { ShieldCheck, KeyRound, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import { ErrorBanner } from "./ui/ErrorBanner";

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess }) => {
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
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

  const sendCode = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Generate PKCE pair
      const pkcePair = await generatePKCE();
      setPkce(pkcePair);

      // 2. Request OTP code from auth server for the default authorized email
      await requestOtp(DEFAULT_EMAIL);

      setSuccessMsg("Verification code sent to your inbox.");
      setStep("verify");
      setResendCooldown(30); // 30s resend cooldown
    } catch (err) {
      setError((err as Error).message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void sendCode();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !pkce || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Verify code and extract auth code
      const authCode = await verifyOtp(DEFAULT_EMAIL, otpCode.trim(), pkce.challenge);

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
    setStep("request");
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

        {step === "request" ? (
          /* ── STEP 1: Send code to the default authorized email ── */
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="default-email-notice">
              <MailCheck size={18} className="default-email-icon" />
              <div className="default-email-text">
                <span className="default-email-label">A one-time code will be sent to</span>
                <span className="default-email-value">{DEFAULT_EMAIL}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <span>Send Verification Code</span>
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
                onClick={() => void sendCode()}
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

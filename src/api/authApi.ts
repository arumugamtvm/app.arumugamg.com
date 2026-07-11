const AUTH_BASE = "https://mcp.arumugamg.com";

// Single authorized account (mirrors mcp.arumugamg.com ALLOWED_EMAIL).
// The auth backend rejects any other address, so the email step is skipped.
export const DEFAULT_EMAIL = "garumugamtvm@gmail.com";

// ── PKCE Helper Functions ───────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a: ArrayBuffer): string {
  const bytes = new Uint8Array(a);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export async function generatePKCE(): Promise<PkcePair> {
  const verifier = generateRandomString(64);
  const hash = await sha256(verifier);
  const challenge = base64urlencode(hash);
  return { verifier, challenge };
}

// ── Auth Server API Calls ───────────────────────────────────────────────────

export interface RequestOtpResponse {
  message?: string;
  error?: string;
}

export interface VerifyOtpResponse {
  redirect_url?: string;
  error?: string;
}

export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

/** 1. Request OTP via email */
export async function requestOtp(email: string): Promise<void> {
  const response = await fetch(`${AUTH_BASE}/oauth/request-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
}

/** 2. Verify OTP, get auth code */
export async function verifyOtp(
  email: string,
  code: string,
  challenge: string
): Promise<string> {
  const redirectUri = window.location.origin + "/";
  const response = await fetch(`${AUTH_BASE}/oauth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      code,
      response_type: "code",
      client_id: "frontend",
      redirect_uri: redirectUri,
      state: "auth_state",
      code_challenge: challenge,
      code_challenge_method: "S256",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as VerifyOtpResponse;
  if (!data.redirect_url) {
    throw new Error("Invalid response: missing redirect URL");
  }

  // Parse redirect URL to extract code
  const url = new URL(data.redirect_url);
  const authCode = url.searchParams.get("code");
  if (!authCode) {
    throw new Error("Failed to parse authorization code");
  }

  return authCode;
}

/** 3. Exchange auth code for signed access token (JWT) */
export async function exchangeCodeForToken(
  code: string,
  verifier: string
): Promise<string> {
  const formData = new FormData();
  formData.append("grant_type", "authorization_code");
  formData.append("code", code);
  formData.append("code_verifier", verifier);

  const response = await fetch(`${AUTH_BASE}/oauth/token`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error("Invalid response: missing access token");
  }

  return data.access_token;
}

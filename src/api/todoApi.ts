import type { Todo, ApiStatus, DecodedToken, Note } from "../types";

const API_BASE = "https://api.arumugamg.com";

/** Get current JWT token from localStorage */
export function getJwtToken(): string {
  return localStorage.getItem("jwt_token") ?? "";
}

/** Set JWT token in localStorage */
export function setJwtToken(token: string): void {
  localStorage.setItem("jwt_token", token.trim());
}

/** Clear JWT token from localStorage */
export function clearJwtToken(): void {
  localStorage.removeItem("jwt_token");
}

/** Helper to decode a JWT token payload locally (base64 decode) */
export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(payloadB64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch {
    return null;
  }
}

/** Check if JWT is expired */
export function isTokenExpired(decoded: DecodedToken): boolean {
  if (!decoded.exp) return false;
  return Date.now() / 1000 > decoded.exp;
}

/** Centralised headers handler */
function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getJwtToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Handles checking the API status (health check) */
export async function getApiStatus(): Promise<ApiStatus> {
  const response = await fetch(`${API_BASE}/status`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<ApiStatus>;
}

/** Fetch all todos */
export async function fetchTodos(status?: "open" | "done" | ""): Promise<Todo[]> {
  const url = new URL(`${API_BASE}/todos`);
  if (status) {
    url.searchParams.append("status", status);
  }
  
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  
  return response.json() as Promise<Todo[]>;
}

/** Create a new todo */
export async function createTodo(title: string, priority: "low" | "normal" | "high"): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, priority }),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  
  return response.json() as Promise<Todo>;
}

/** Update todo status to done */
export async function completeTodo(id: number): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  
  return response.json() as Promise<Todo>;
}

/** Delete a todo */
export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
}

/** Fetch all notes */
export async function fetchNotes(): Promise<Note[]> {
  const response = await fetch(`${API_BASE}/notes`, {
    method: "GET",
    headers: getHeaders(),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  
  return response.json() as Promise<Note[]>;
}

/** Create a new note */
export async function createNote(title: string, content: string): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, content }),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  
  return response.json() as Promise<Note>;
}

/** Update a note */
export async function updateNote(id: number, title: string, content: string): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ title, content }),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  
  return response.json() as Promise<Note>;
}

/** Delete a note */
export async function deleteNote(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
}

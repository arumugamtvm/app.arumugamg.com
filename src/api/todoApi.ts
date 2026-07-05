import type { Todo, ApiStatus, DecodedToken, Note, RecurrenceRule, Subtask } from "../types";

const API_BASE = "https://api.arumugamg.com";

// ── Auth helpers ───────────────────────────────────────────────────────────

export function getJwtToken(): string {
  return localStorage.getItem("jwt_token") ?? "";
}

export function setJwtToken(token: string): void {
  localStorage.setItem("jwt_token", token.trim());
}

export function clearJwtToken(): void {
  localStorage.removeItem("jwt_token");
}

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

export function isTokenExpired(decoded: DecodedToken): boolean {
  if (!decoded.exp) return false;
  return Date.now() / 1000 > decoded.exp;
}

// ── Shared fetch helpers ───────────────────────────────────────────────────

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getJwtToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, headers: { ...getHeaders(), ...(init?.headers ?? {}) } });
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ── Health ─────────────────────────────────────────────────────────────────

export async function getApiStatus(): Promise<ApiStatus> {
  const response = await fetch(`${API_BASE}/status`, { method: "GET", headers: getHeaders() });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<ApiStatus>;
}

// ── Todos ──────────────────────────────────────────────────────────────────

/** Fetch all todos with optional status and date range filters */
export async function fetchTodos(
  status?: "open" | "done" | "",
  startDate?: string,
  endDate?: string,
): Promise<Todo[]> {
  const url = new URL(`${API_BASE}/todos`);
  if (status) url.searchParams.append("status", status);
  if (startDate) url.searchParams.append("start_date", startDate);
  if (endDate) url.searchParams.append("end_date", endDate);
  return apiFetch<Todo[]>(url.toString(), { method: "GET" });
}

/** Fetch open todos due today */
export async function fetchTodayTodos(): Promise<Todo[]> {
  return apiFetch<Todo[]>(`${API_BASE}/todos/today`, { method: "GET" });
}

/** Fetch open todos that are past their due date */
export async function fetchOverdueTodos(): Promise<Todo[]> {
  return apiFetch<Todo[]>(`${API_BASE}/todos/overdue`, { method: "GET" });
}

/** Fetch open todos due within the next N days (default: 7) */
export async function fetchUpcomingTodos(days = 7): Promise<Todo[]> {
  return apiFetch<Todo[]>(`${API_BASE}/todos/upcoming?days=${days}`, { method: "GET" });
}

/** Search todos by keyword across title and description */
export async function searchTodos(query: string): Promise<Todo[]> {
  const url = new URL(`${API_BASE}/todos/search`);
  url.searchParams.append("q", query);
  return apiFetch<Todo[]>(url.toString(), { method: "GET" });
}

/** Create a new todo */
export async function createTodo(
  title: string,
  priority: "low" | "normal" | "high",
  description?: string,
  dueDate?: string,
  recurrence?: RecurrenceRule,
  subtasks?: string[],
  labels?: string[],
): Promise<Todo> {
  const body: Record<string, unknown> = { title, priority };
  if (description) body.description = description;
  if (dueDate) body.due_date = dueDate;
  if (recurrence) body.recurrence = recurrence;
  if (subtasks && subtasks.length > 0) body.subtasks = subtasks;
  if (labels && labels.length > 0) body.labels = labels;

  const result = await apiFetch<{ todo: Todo }>(`${API_BASE}/todos`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return result.todo;
}

/** Update fields on an existing todo */
export async function updateTodo(
  id: number,
  fields: {
    title?: string;
    priority?: "low" | "normal" | "high";
    description?: string;
    status?: "open" | "done";
    due_date?: string;
    recurrence?: RecurrenceRule;
    labels?: string[];
  },
): Promise<Todo> {
  return apiFetch<Todo>(`${API_BASE}/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

/** Mark a todo as done */
export async function completeTodo(id: number): Promise<Todo> {
  return apiFetch<Todo>(`${API_BASE}/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "done" }),
  });
}

/** Reopen a completed todo (mark back to open) */
export async function reopenTodo(id: number): Promise<Todo> {
  return apiFetch<Todo>(`${API_BASE}/todos/${id}/reopen`, { method: "PUT" });
}

/** Bulk complete multiple todos at once */
export async function bulkCompleteTodos(ids: number[]): Promise<{ completed: number }> {
  return apiFetch<{ completed: number }>(`${API_BASE}/todos/bulk-complete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

/** Bulk delete multiple todos at once */
export async function bulkDeleteTodos(ids: number[]): Promise<{ deleted: number }> {
  return apiFetch<{ deleted: number }>(`${API_BASE}/todos/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

/** Delete a single todo */
export async function deleteTodo(id: number): Promise<void> {
  return apiFetch<void>(`${API_BASE}/todos/${id}`, { method: "DELETE" });
}

// ── Notes ──────────────────────────────────────────────────────────────────

export async function fetchNotes(): Promise<Note[]> {
  return apiFetch<Note[]>(`${API_BASE}/notes`, { method: "GET" });
}

export async function fetchNote(id: number): Promise<Note> {
  return apiFetch<Note>(`${API_BASE}/notes/${id}`, { method: "GET" });
}

export async function fetchPinnedNotes(): Promise<Note[]> {
  return apiFetch<Note[]>(`${API_BASE}/notes/pinned`, { method: "GET" });
}

export async function searchNotes(query: string): Promise<Note[]> {
  return apiFetch<Note[]>(`${API_BASE}/notes/search?q=${encodeURIComponent(query)}`, { method: "GET" });
}

export async function createNote(title: string, content: string): Promise<Note> {
  return apiFetch<Note>(`${API_BASE}/notes`, {
    method: "POST",
    body: JSON.stringify({ title, content }),
  });
}

export async function updateNote(
  id: number,
  fields: { title?: string; content?: string; pinned?: boolean }
): Promise<Note> {
  return apiFetch<Note>(`${API_BASE}/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function togglePinNote(id: number): Promise<Note> {
  return apiFetch<Note>(`${API_BASE}/notes/${id}/pin`, {
    method: "PUT",
  });
}

export async function deleteNote(id: number): Promise<void> {
  return apiFetch<void>(`${API_BASE}/notes/${id}`, { method: "DELETE" });
}


// ── Subtasks ───────────────────────────────────────────────────────────────

export async function fetchSubtasks(todoId: number): Promise<Subtask[]> {
  return apiFetch<Subtask[]>(`${API_BASE}/todos/${todoId}/subtasks`, { method: "GET" });
}

/** Fetch subtasks for many todos in a single bulk request */
export async function fetchSubtasksForTodos(todoIds: number[]): Promise<Subtask[]> {
  if (todoIds.length === 0) return [];
  return apiFetch<Subtask[]>(`${API_BASE}/subtasks?todo_ids=${todoIds.join(",")}`, { method: "GET" });
}

export async function createSubtask(todoId: number, title: string): Promise<Subtask> {
  return apiFetch<Subtask>(`${API_BASE}/todos/${todoId}/subtasks`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function updateSubtask(
  id: number,
  fields: { title?: string; status?: "open" | "done" },
): Promise<Subtask> {
  return apiFetch<Subtask>(`${API_BASE}/subtasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteSubtask(id: number): Promise<void> {
  return apiFetch<void>(`${API_BASE}/subtasks/${id}`, { method: "DELETE" });
}

export async function completeSubtask(id: number): Promise<Subtask> {
  return apiFetch<Subtask>(`${API_BASE}/subtasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "done" }),
  });
}

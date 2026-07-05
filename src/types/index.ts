export interface Todo {
  id: number;
  title: string;
  description: string;
  priority: "low" | "normal" | "high";
  status: "open" | "done";
  due_date: string | null;
  recurrence: string | null;
  recurring_group_id: string | null;
  labels: string[];
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  status: "open" | "done";
  created_at: string;
  updated_at: string;
}

export type RecurrenceFrequency =
  | "daily" | "weekdays" | "weekends" | "weekly" | "monthly" | "yearly" | "custom";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  weekdays?: number[];
}

export type QuickViewFilter = "all" | "today" | "upcoming" | "overdue";

export interface ApiStatus {
  status: string;
  timestamp: string;
}

export interface DecodedToken {
  email: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  pinned: number; // 0 | 1 (SQLite boolean)
  created_at: string;
  updated_at: string;
}
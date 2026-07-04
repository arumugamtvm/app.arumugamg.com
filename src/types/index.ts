export interface Todo {
  id: number;
  title: string;
  priority: "low" | "normal" | "high";
  status: "open" | "done";
  created_at: string;
}

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
  created_at: string;
  updated_at: string;
}

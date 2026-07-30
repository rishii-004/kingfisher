export interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  platform: "leetcode" | "gfg" | "neetcode" | "other";
  platform_url: string;
  difficulty: "easy" | "medium" | "hard";
  topic_tags: string[];
  company_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProblemList {
  id: string;
  name: string;
  description: string | null;
  is_global: boolean;
  is_custom: boolean;
  owner_id: string | null;
  problem_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProblemListDetail extends ProblemList {
  problems: (Problem & { order: number })[];
}

export interface UserProblem {
  user_id: string;
  problem_id: string;
  status: "todo" | "solving" | "solved" | "skipped";
  solved_at: string | null;
  problem: Problem;
}

export interface SolveLog {
  id: string;
  user_id: string;
  problem_id: string;
  mistake_tags: string[];
  notes: string;
  time_spent: "<15m" | "15-30m" | "30-60m" | "1h+";
  solved_at: string;
}

export interface Platform {
  value: "leetcode" | "gfg" | "neetcode" | "other";
  label: string;
  logo_url: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  problem_id: string;
  problem: Problem;
  interval_days: number;
  due_at: string;
  review_stage: number;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

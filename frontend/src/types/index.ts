export interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  max_lists: number;
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

export type MistakeTag =
  | "edge_case_missed"
  | "off_by_one"
  | "tle"
  | "wrong_approach"
  | "syntax_error"
  | "didnt_know_pattern"
  | "mle"
  | "other";

export const MISTAKE_TAG_LABELS: Record<MistakeTag, string> = {
  edge_case_missed: "Edge case missed",
  off_by_one: "Off-by-one",
  tle: "Time limit exceeded",
  wrong_approach: "Wrong approach",
  syntax_error: "Syntax error",
  didnt_know_pattern: "Didn't know pattern",
  mle: "Memory limit exceeded",
  other: "Other",
};

export interface StatusUpdateResponse {
  user_problem: UserProblem;
  solve_log_required: boolean;
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

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface RadarEntry {
  topic: string;
  solved: number;
}

export interface DifficultyBreakdown {
  easy: number;
  medium: number;
  hard: number;
  easy_total: number;
  medium_total: number;
  hard_total: number;
}

export interface TimeSpentDay {
  date: string;
  day: string;
  minutes: number;
}

export interface CompanyMastery {
  company: string;
  solved: number;
  total: number;
}

export interface SearchResult {
  type: "problem" | "note" | "list";
  relevance: number;
  data: Problem | ProblemList | { problem_id: string; problem_title: string; notes_snippet: string };
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export interface WeeklyPattern {
  day: string;
  count: number;
}

export interface TopicMastery {
  topic: string;
  solved: number;
  total: number;
  reviews_completed: number;
  mistakes: number;
}

export interface MistakeBreakdown {
  tag: string;
  label: string;
  count: number;
}

export interface ReviewPipeline {
  overdue: number;
  due_today: number;
  due_this_week: number;
  due_next_week: number;
  due_later: number;
}

export interface ConsistencyData {
  total_solved: number;
  solved_this_month: number;
  solved_last_7_days: number;
  solved_last_30_days: number;
  current_streak: number;
  longest_streak: number;
}

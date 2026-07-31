const PLATFORM_COLORS: Record<string, string> = {
  "leetcode": "text-orange-400",
  "gfg": "text-green-400",
  "neetcode": "text-sky-400",
  "other": "text-surface-400",
};

export function platformColor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? "text-surface-400";
}

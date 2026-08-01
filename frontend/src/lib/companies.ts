const COMPANY_COLORS: Record<string, string> = {
  "Google": "text-sky-400",
  "Amazon": "text-orange-400",
  "Meta": "text-blue-400",
  "Microsoft": "text-cyan-400",
  "Apple": "text-fuchsia-400",
  "Netflix": "text-red-400",
  "Adobe": "text-rose-400",
  "Uber": "text-lime-400",
  "Bloomberg": "text-amber-400",
  "TikTok": "text-teal-400",
  "Stripe": "text-violet-400",
  "Goldman Sachs": "text-yellow-400",
  "Atlassian": "text-indigo-400",
  "Oracle": "text-green-400",
  "Twitter": "text-pink-400",
};

export function companyColor(company: string): string {
  return COMPANY_COLORS[company] ?? "text-surface-400";
}

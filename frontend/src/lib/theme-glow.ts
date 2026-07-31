export interface GlowOption {
  name: string;
  value: string;
}

const GLOW_KEY = "kingfisher:bg-glow";
export const GLOW_DEFAULT = "rgba(249,115,22,0.04)";

export const glowOptions: GlowOption[] = [
  { name: "None", value: "transparent" },
  { name: "Orange", value: "rgba(249,115,22,0.04)" },
  { name: "Amber", value: "rgba(245,158,11,0.04)" },
  { name: "Yellow", value: "rgba(234,179,8,0.04)" },
  { name: "Lime", value: "rgba(132,204,22,0.04)" },
  { name: "Green", value: "rgba(34,197,94,0.04)" },
  { name: "Emerald", value: "rgba(16,185,129,0.04)" },
  { name: "Teal", value: "rgba(20,184,166,0.04)" },
  { name: "Cyan", value: "rgba(6,182,212,0.04)" },
  { name: "Sky", value: "rgba(14,165,233,0.04)" },
  { name: "Blue", value: "rgba(59,130,246,0.04)" },
  { name: "Indigo", value: "rgba(99,102,241,0.04)" },
  { name: "Violet", value: "rgba(139,92,246,0.04)" },
  { name: "Purple", value: "rgba(168,85,247,0.04)" },
  { name: "Fuchsia", value: "rgba(217,70,239,0.04)" },
  { name: "Pink", value: "rgba(236,72,153,0.04)" },
  { name: "Rose", value: "rgba(244,63,94,0.04)" },
  { name: "Red", value: "rgba(239,68,68,0.04)" },
];

export interface ThemeOption {
  key: string;
  name: string;
  vars: Record<string, string>;
}

const THEME_KEY = "kingfisher:theme";
export const THEME_DEFAULT = "ash";

export const themeOptions: ThemeOption[] = [
  {
    key: "ash",
    name: "Ash",
    vars: {
      "--color-surface-50": "#2a2c2e",
      "--color-surface-100": "#2a2c2e",
      "--color-surface-200": "#383a3c",
      "--color-surface-300": "#9ea1a5",
    },
  },
  {
    key: "charcoal",
    name: "Charcoal",
    vars: {
      "--color-surface-50": "#252729",
      "--color-surface-100": "#252729",
      "--color-surface-200": "#313335",
      "--color-surface-300": "#8f9297",
    },
  },
  {
    key: "graphite",
    name: "Graphite",
    vars: {
      "--color-surface-50": "#1e2022",
      "--color-surface-100": "#1e2022",
      "--color-surface-200": "#2a2c2e",
      "--color-surface-300": "#83868b",
    },
  },
  {
    key: "slate",
    name: "Slate",
    vars: {
      "--color-surface-50": "#18191b",
      "--color-surface-100": "#18191b",
      "--color-surface-200": "#232528",
      "--color-surface-300": "#76797e",
    },
  },
  {
    key: "obsidian",
    name: "Obsidian",
    vars: {
      "--color-surface-50": "#121314",
      "--color-surface-100": "#121314",
      "--color-surface-200": "#1d1f21",
      "--color-surface-300": "#696c70",
    },
  },
  {
    key: "void",
    name: "Void",
    vars: {
      "--color-surface-50": "#0b0c0d",
      "--color-surface-100": "#0b0c0d",
      "--color-surface-200": "#16181a",
      "--color-surface-300": "#5c5f63",
    },
  },
];

export function getThemeKey(): string {
  try {
    return localStorage.getItem(THEME_KEY) || THEME_DEFAULT;
  } catch {
    return THEME_DEFAULT;
  }
}

export function applyTheme(key: string): void {
  const theme = themeOptions.find((t) => t.key === key) ?? themeOptions[0];
  for (const [prop, value] of Object.entries(theme.vars)) {
    document.documentElement.style.setProperty(prop, value);
  }
}

export function setThemeKey(key: string): void {
  try {
    localStorage.setItem(THEME_KEY, key);
  } catch {
    // storage unavailable — ignore
  }
  applyTheme(key);
}

export function getGlowColor(): string {
  try {
    return localStorage.getItem(GLOW_KEY) || GLOW_DEFAULT;
  } catch {
    return GLOW_DEFAULT;
  }
}

export function applyGlowColor(value: string): void {
  document.documentElement.style.setProperty("--bg-glow", value);
}

export function setGlowColor(value: string): void {
  try {
    localStorage.setItem(GLOW_KEY, value);
  } catch {
    // storage unavailable — ignore
  }
  applyGlowColor(value);
}

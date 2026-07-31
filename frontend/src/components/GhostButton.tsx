import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

export default function GhostButton({ children, onClick, type, disabled, className }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

interface Props {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function Checkbox({ checked, onChange, disabled }: Props) {
  return (
    <label
      className={`relative flex items-center justify-center w-4 h-4 cursor-pointer transition-colors duration-100 border ${
        checked
          ? "bg-rose-500 border-rose-500"
          : "bg-transparent border-surface-500/40"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      {checked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fafaf9"
          strokeWidth={3.5}
          strokeLinecap="square"
          className="pointer-events-none"
        >
          <path d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </label>
  );
}

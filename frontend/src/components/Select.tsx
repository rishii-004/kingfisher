import { useRef, useState } from "react";
import { Select as BaseSelect } from "@base-ui/react";

interface Option {
  value: string;
  label: string;
  labelClass?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Option[];
  className?: string;
  bordered?: boolean;
}

export default function Select({ value, onChange, placeholder, options, className, bordered = true }: Props) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);
  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(v) => onChange(v ?? "")}
      onOpenChange={(open) => {
        if (!open) {
          setSearch("");
        } else {
          // Base UI moves focus into the listbox on open; grab it back for
          // the search box a tick later so typing works immediately.
          requestAnimationFrame(() => searchInputRef.current?.focus());
        }
      }}
    >
      <BaseSelect.Trigger
        className={`group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer outline-none ${
          bordered
            ? "bg-surface-50 border border-surface-300 text-surface-700 focus:border-rose-600"
            : "bg-surface-200/30 text-surface-400 focus:text-surface-700"
        } ${className ?? ""}`}
      >
        <BaseSelect.Value placeholder={placeholder ?? "Select..."} className={`flex-1 text-left ${selected?.labelClass ?? ""}`} />
        <BaseSelect.Icon className="text-surface-500 transition-transform group-data-[open]:rotate-180">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        {/* alignItemWithTrigger's "line the selected item up with the
            trigger" math breaks once a search box shifts the popup's
            internal layout, so fall back to normal below-trigger
            positioning for any list long enough to have one. */}
        <BaseSelect.Positioner className="z-50" sideOffset={4} alignItemWithTrigger={options.length <= 6}>
          <BaseSelect.Popup className="origin-top-right min-w-[160px] max-h-[min(24rem,var(--available-height))] overflow-y-auto bg-surface-100 border border-surface-300 shadow-lg data-[side=none]:animate-none data-[side=bottom]:animate-in data-[side=bottom]:fade-in data-[side=bottom]:slide-in-from-top-1">
            {options.length > 6 && (
              <div className="sticky top-0 z-10 bg-surface-100 border-b border-surface-300/50 p-1.5">
                <input
                  ref={searchInputRef}
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key !== "Escape") e.stopPropagation(); }}
                  placeholder="Search..."
                  className="w-full bg-surface-200/50 px-2 py-1.5 text-xs text-surface-700 outline-none placeholder:text-surface-500"
                />
              </div>
            )}
            <BaseSelect.List className="py-1">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-xs text-surface-500">No matches</div>
              )}
              {filtered.map((opt) => (
                <BaseSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-400 cursor-pointer hover:bg-surface-200 hover:text-surface-900 data-[highlighted]:bg-surface-200 data-[highlighted]:text-surface-900 data-[active]:bg-surface-200 outline-none"
                >
                  <BaseSelect.ItemText className={`flex-1 ${opt.labelClass ?? ""}`}>{opt.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#e11d48" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

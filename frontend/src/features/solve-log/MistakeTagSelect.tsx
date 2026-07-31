import { MISTAKE_TAG_LABELS, type MistakeTag } from "../../types";

const TAGS = Object.entries(MISTAKE_TAG_LABELS) as [MistakeTag, string][];

interface Props {
  selected: MistakeTag[];
  onChange: (tags: MistakeTag[]) => void;
}

export default function MistakeTagSelect({ selected, onChange }: Props) {
  const toggle = (tag: MistakeTag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map(([tag, label]) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200 ${
            selected.includes(tag)
              ? "bg-rose-500/20 border-rose-500/40 text-rose-500"
              : "bg-surface-200/50 border-surface-300/50 text-surface-400 hover:border-white/[0.2] hover:text-surface-900"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

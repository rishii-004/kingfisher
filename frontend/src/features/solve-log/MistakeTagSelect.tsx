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
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            selected.includes(tag)
              ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
              : "bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-500"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

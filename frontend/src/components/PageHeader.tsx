interface Props {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
      {description && <p className="text-sm text-surface-400 mt-0.5">{description}</p>}
    </div>
  );
}

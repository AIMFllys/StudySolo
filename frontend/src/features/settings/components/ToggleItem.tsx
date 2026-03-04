interface ToggleItemProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

export function ToggleItem({
  checked,
  onChange,
  label,
  description,
}: ToggleItemProps) {
  return (
    <label className="group flex cursor-pointer items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked
            ? 'bg-primary'
            : 'bg-white/[0.12] dark:bg-white/[0.12] light:bg-slate-300'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

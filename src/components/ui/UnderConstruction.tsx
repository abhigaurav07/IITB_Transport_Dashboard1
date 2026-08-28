import { ConstructionIcon } from "@/components/icons";

export default function UnderConstruction({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-20 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
        <ConstructionIcon className="h-6 w-6" />
      </span>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
        {description ??
          "This module is part of the planned dashboard and has not been built yet. It will follow the same design system once its workflow is defined."}
      </p>
      <span className="mt-5 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
        Under Construction
      </span>
    </div>
  );
}

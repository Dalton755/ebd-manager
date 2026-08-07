import type { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
};

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center gap-4">

      <div className="rounded-xl bg-blue-100 p-3">
        <Icon
          className="h-7 w-7 text-blue-600"
          strokeWidth={2}
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

    </div>
  );
}
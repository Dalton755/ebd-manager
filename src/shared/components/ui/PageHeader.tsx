import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
};

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
}: Props) {
  return (
    <div className="mb-3 flex min-w-0 items-start gap-3 sm:mb-5 sm:items-center">

      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm sm:h-11 sm:w-11">
          <Icon size={20} />
        </div>
      )}

      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-0.5 max-w-3xl text-sm leading-5 text-slate-500 sm:mt-1 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

    </div>
  );
}

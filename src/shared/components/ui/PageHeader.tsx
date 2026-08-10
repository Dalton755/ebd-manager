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
    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex items-center gap-3">

        {Icon && (
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <Icon size={20} />
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
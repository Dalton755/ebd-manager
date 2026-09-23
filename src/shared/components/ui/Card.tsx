import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.035)]",
        "p-3.5 sm:p-5",
        className
      )}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "mb-3 border-b border-slate-100 pb-3 sm:mb-4 sm:pb-4",
        className
      )}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...props}
      className={clsx(
        "text-base font-bold tracking-tight text-slate-900 sm:text-xl",
        className
      )}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "space-y-3 sm:space-y-4",
        className
      )}
    />
  );
}

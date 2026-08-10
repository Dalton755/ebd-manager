import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto",
        className
      )}
    >
      {children}
    </button>
  );
}
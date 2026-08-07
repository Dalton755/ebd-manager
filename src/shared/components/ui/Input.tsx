import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({
  className,
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200",
        className
      )}
    />
  );
}
import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const inputClass =
  "w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp cursor-pointer";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...props },
  ref
) {
  return <input ref={ref} className={`${inputClass} ${className}`} {...props} />;
});

import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

const base =
  "cursor-pointer font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-px";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-lamp text-ink hover:brightness-110 focus-visible:outline-lamp",
  secondary:
    "border border-border text-text hover:border-text/40 hover:text-text",
  ghost: "text-lamp hover:brightness-110",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className = "", type = "button", ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);

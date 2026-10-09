import { type ButtonHTMLAttributes, type FC, type ReactNode } from "react";

// hooks
import { useTheme } from "../hooks";

interface IProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
}

const BigButton: FC<IProps> = ({
  children,
  icon,
  endIcon,
  fullWidth = false,
  variant = "primary",
  className,
  disabled,
  type = "button",
  ...props
}) => {
  const { theme } = useTheme();

  const variantClassName: string =
    variant === "primary"
      ? "border-primary bg-primary text-white hover:bg-primary/90"
      : variant === "outline"
        ? `border-primary bg-transparent text-primary hover:bg-primary/10 ${theme === "light" ? "hover:text-primary" : "hover:text-white"}`
        : `border-transparent bg-transparent ${theme === "light" ? "text-black hover:bg-black/5" : "text-white hover:bg-white/10"}`;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`whitespace-nowrap group flex cursor-pointer items-center justify-center gap-3 rounded-full border px-30 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-70 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none ${fullWidth ? "w-full self-stretch" : "w-fit self-center"} ${variantClassName} ${className || ""}`}
      {...props}
    >
      {icon && (
        <span className="flex shrink-0 items-center justify-center">
          {icon}
        </span>
      )}

      <span>{children}</span>

      {endIcon && (
        <span className="flex shrink-0 items-center justify-center transition-transform duration-300">
          {endIcon}
        </span>
      )}
    </button>
  );
};

export default BigButton;

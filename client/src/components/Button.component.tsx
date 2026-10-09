import { type ButtonHTMLAttributes, type FC, type ReactNode } from "react";

// hooks
import { useTheme } from "../hooks";

type TButtonVariant = "primary" | "secondary" | "danger";

interface IProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: TButtonVariant;
  icon?: ReactNode;
  className?: string;
  unstyled?: boolean;
}

const Button: FC<IProps> = ({
  children,
  variant = "primary",
  icon,
  className = "",
  unstyled = false,
  disabled = false,
  type = "button",
  ...props
}) => {
  const { theme } = useTheme();

  const primaryClassName: string =
    "bg-primary px-6 font-semibold text-white hover:opacity-70 disabled:opacity-60";

  const secondaryClassName: string =
    theme === "light"
      ? "border border-black/10 px-5 font-medium text-darkgray hover:bg-black/5 hover:opacity-70 disabled:opacity-50"
      : "border border-white/10 px-5 font-medium text-gray hover:bg-white/5 hover:opacity-70 disabled:opacity-50";

  const dangerClassName: string =
    "bg-red-500 px-6 font-semibold text-white hover:bg-red-600 disabled:opacity-60";

  const getVariantClassName = (): string => {
    switch (variant) {
      case "secondary":
        return secondaryClassName;

      case "danger":
        return dangerClassName;

      default:
        return primaryClassName;
    }
  };

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={`${
        unstyled
          ? ""
          : `flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl text-sm transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-300 disabled:pointer-events-none ${getVariantClassName()}`
      } ${className}`.trim()}
    >
      {icon}

      {children}
    </button>
  );
};

export default Button;

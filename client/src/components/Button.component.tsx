import { type ButtonHTMLAttributes, type FC, type ReactNode } from "react";

type TButtonVariant = "primary" | "secondary" | "danger" | "danger-outline";

interface IProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: TButtonVariant;
  icon?: ReactNode;
  className?: string;
  unstyled?: boolean;
}

/**
 * iOS 27 system button: a filled capsule with a centred label. Primary uses the
 * app tint, secondary the neutral fill; no glass (glass is for floating chrome).
 */
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
  return (
    <button
      {...props}
      data-ui-button
      data-variant={unstyled ? undefined : variant}
      type={type}
      disabled={disabled}
      className={`${unstyled ? "" : "ios-button"} ${className}`.trim()}
    >
      {icon}

      {children}
    </button>
  );
};

export default Button;

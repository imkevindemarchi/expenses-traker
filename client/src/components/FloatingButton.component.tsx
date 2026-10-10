import { type ButtonHTMLAttributes, type FC, type ReactNode, type Ref } from "react";

import "../styles/FloatingMonthButton.styles.css";
import { getLiquidGlassClass } from "../assets/constants";

// hooks
import { useTheme } from "../hooks";

interface IProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  ariaLabel: string;
  icon: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const FloatingButton: FC<IProps> = ({
  ariaLabel,
  icon,
  className = "",
  disabled = false,
  type = "button",
  ...buttonProps
}) => {
  const { theme } = useTheme();

  return (
    <button
      {...buttonProps}
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      data-glass-theme={theme}
      className={`floating-month-button group relative flex size-13 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border sm:size-18 max-sm:[&_svg]:size-6.5 disabled:pointer-events-none disabled:opacity-50 ${getLiquidGlassClass(theme)} ${className}`}
    >
      <span className="floating-month-button__icon relative z-10 flex items-center justify-center text-primary">
        {icon}
      </span>
    </button>
  );
};

export default FloatingButton;

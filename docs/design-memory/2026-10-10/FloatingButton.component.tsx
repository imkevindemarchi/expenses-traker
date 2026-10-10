import { type ButtonHTMLAttributes, type FC, type ReactNode, type Ref } from "react";

import "../styles/FloatingButton.styles.css";

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
  onPointerMove,
  onPointerLeave,
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
      onPointerMove={(event) => {
        if (!disabled && event.pointerType === "mouse") {
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--glass-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
          event.currentTarget.style.setProperty("--glass-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
        }
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.removeProperty("--glass-x");
        event.currentTarget.style.removeProperty("--glass-y");
        onPointerLeave?.(event);
      }}
      className={`floating-glass-button group relative flex size-13 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full sm:size-18 max-sm:[&_svg]:size-6.5 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      <span aria-hidden="true" className="floating-glass-button__caustic" />
      <span aria-hidden="true" className="floating-glass-button__rim" />
      <span className="floating-glass-button__icon relative z-10 flex items-center justify-center text-primary">
        {icon}
      </span>
    </button>
  );
};

export default FloatingButton;

import { type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import "../styles/IconButton.styles.css";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  ariaLabel?: string;
  variant?: "default" | "danger" | "success";
  size?: "default" | "compact";
  rotateOnHover?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export default function IconButton({ icon, children, ariaLabel, variant = "default", size = "default", rotateOnHover = false, className = "", type = "button", title, ...props }: IconButtonProps) {
  const label = ariaLabel ?? props["aria-label"];
  return <button {...props} type={type} aria-label={label} title={title ?? label} data-icon-size={size} data-icon-variant={variant} className={`icon-button ${rotateOnHover ? "icon-button-rotate" : ""} ${className}`}>
    <span className="icon-button-content" aria-hidden="true">{icon ?? children}</span>
  </button>;
}

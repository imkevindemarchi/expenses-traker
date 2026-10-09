import { type ButtonHTMLAttributes, type FC, type ReactNode, type Ref } from "react";

// assets
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
      className={`liquid-glass-interaction group relative flex size-13 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 shadow-sm ring-1 ring-inset ring-white/10 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-300 ease-out active:scale-95 sm:size-18 max-sm:[&_svg]:size-6.5 disabled:pointer-events-none disabled:opacity-50 ${getLiquidGlassClass(theme)} ${className}`}
    >
      {/* <span className="pointer-events-none absolute inset-px rounded-full bg-linear-to-b from-white/30 via-white/5 to-transparent opacity-70 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:inset-0 group-hover:opacity-100" />

      <span className="pointer-events-none absolute -left-6 -top-8 size-16 rounded-full bg-white/45 blur-xl transition-transform duration-700 ease-out group-hover:translate-x-10 group-hover:translate-y-8 group-hover:scale-125" />

      <span className="pointer-events-none absolute bottom-1 left-1/2 h-px w-8 -translate-x-1/2 rounded-full bg-white/60 blur-[1px] transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:w-11 group-hover:bg-white/80" />

      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:ring-white/40" /> */}

      <span className="relative z-10 flex items-center justify-center text-primary transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-active:scale-90">
        {icon}
      </span>
    </button>
  );
};

export default FloatingButton;

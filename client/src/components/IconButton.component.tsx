import { type ButtonHTMLAttributes, type FC, type ReactNode } from "react";

interface IProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  ariaLabel: string;
  rotateOnHover?: boolean;
}

const IconButton: FC<IProps> = ({
  icon,
  ariaLabel,
  className,
  rotateOnHover = false,
  type = "button",
  ...props
}) => {
  return (
    <button
      {...props}
      type={type}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`group flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-primary text-white transition-[transform,background-color,border-color,color] duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50 sm:border sm:border-primary/20 sm:bg-primary/10 sm:text-primary sm:hover:border-primary sm:hover:bg-primary sm:hover:text-white ${className ?? ""}`}
    >
      <span
        className={`transition-transform duration-300 ${rotateOnHover ? "group-hover:rotate-90" : ""}`}
      >
        {icon}
      </span>
    </button>
  );
};

export default IconButton;

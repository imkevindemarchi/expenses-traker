import { type FC, type ReactNode } from "react";

export type TChipVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface IProps {
  children: ReactNode;
  variant?: TChipVariant;
  icon?: ReactNode;
  className?: string;
}

const Chip: FC<IProps> = ({
  children,
  variant = "neutral",
  icon,
  className = "",
}) => {
  const variantClasses: Record<TChipVariant, string> = {
    primary: "border-primary/20 bg-primary/10 text-primary",
    success: "border-green-500/20 bg-green-500/10 text-green-500",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    danger: "border-red-500/20 bg-red-500/10 text-red-500",
    neutral: "border-gray-500/20 bg-gray-500/10 text-gray-500",
  };

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold leading-none ${variantClasses[variant]} ${className}`}
    >
      {icon}

      <span>{children}</span>
    </span>
  );
};

export default Chip;

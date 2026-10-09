import { type ChangeEvent, type FC, type InputHTMLAttributes } from "react";

// hooks
import { useTheme } from "../hooks";

type TSwitchColor = "primary" | "sky" | "rose" | "emerald" | "amber";
type TSwitchPosition = "start" | "end";

interface IProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  label: string;
  error?: string;
  className?: string;
  color?: TSwitchColor;
  switchPosition?: TSwitchPosition;
  onChange: (checked: boolean) => void;
}

const ACTIVE_COLOR_CLASSES: Record<TSwitchColor, string> = {
  primary: "bg-primary peer-focus-visible:ring-primary",
  sky: "bg-sky-500 peer-focus-visible:ring-sky-500",
  rose: "bg-rose-500 peer-focus-visible:ring-rose-500",
  emerald: "bg-emerald-500 peer-focus-visible:ring-emerald-500",
  amber: "bg-amber-500 peer-focus-visible:ring-amber-500",
};

const Switch: FC<IProps> = ({
  label,
  error,
  className,
  color = "primary",
  switchPosition = "start",
  id,
  name,
  checked = false,
  disabled = false,
  onChange,
  ...props
}) => {
  const { theme } = useTheme();

  const inputId: string = id || name || label;

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.checked);
  };

  const switchControl = (
    <div className="relative shrink-0">
      <input
        {...props}
        id={inputId}
        name={name}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="peer sr-only"
      />

      <div
        className={`relative h-6 w-11 rounded-full transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${checked ? ACTIVE_COLOR_CLASSES[color] : theme === "light" ? "bg-black/15 peer-focus-visible:ring-black/30" : "bg-white/20 peer-focus-visible:ring-white/35"} ${theme === "light" ? "peer-focus-visible:ring-offset-white" : "peer-focus-visible:ring-offset-darkgray"}`}
      >
        <div
          className={`absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </div>
    </div>
  );

  return (
    <div className={`min-w-0 ${className || ""}`}>
      <label
        htmlFor={inputId}
        className={`flex w-full items-center gap-3 ${switchPosition === "end" ? "justify-between" : "justify-start"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {switchPosition === "start" && switchControl}

        <span
          className={`min-w-0 text-sm font-normal ${theme === "light" ? "text-black" : "text-white"}`}
        >
          {label}
        </span>

        {switchPosition === "end" && switchControl}
      </label>

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Switch;

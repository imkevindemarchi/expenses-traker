import {
  type ChangeEvent,
  type FC,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

// hooks
import { useTheme } from "../hooks";

interface IProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "value"
> {
  label: string;
  value: string;
  icon?: ReactNode;
  error?: string;
  className?: string;
  allowDecimal?: boolean;
  compact?: boolean;
  onChange: (value: string) => void;
}

const InputNumber: FC<IProps> = ({
  label,
  value,
  icon,
  error,
  className,
  id,
  name,
  allowDecimal = false,
  compact = false,
  min = 0,
  onChange,
  ...props
}) => {
  const { theme } = useTheme();

  const inputId: string = id || name || label;

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextValue: string = event.target.value;

    if (!allowDecimal) {
      onChange(nextValue.replace(/\D/g, ""));
      return;
    }

    const normalizedValue: string = nextValue
      .replace(/,/g, ".")
      .replace(/[^0-9.]/g, "");

    const [integerPart = "", ...decimalParts] = normalizedValue.split(".");
    const hasDecimalSeparator: boolean = normalizedValue.includes(".");
    const decimalPart: string = decimalParts.join("");

    const sanitizedValue: string = hasDecimalSeparator
      ? `${integerPart || "0"}.${decimalPart}`
      : integerPart;

    onChange(sanitizedValue);
  };

  return (
    <div className={`w-full ${className || ""}`}>
      <label
        htmlFor={inputId}
        className={`${compact ? "mb-1 block text-xs font-semibold" : "mb-2 block text-base font-semibold sm:text-sm"} ${theme === "light" ? "text-black" : "text-white"}`}
      >
        {label}
      </label>

      <div
        className={`group relative flex items-center ${compact ? "gap-2" : "gap-3"}`}
      >
        {icon && (
          <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-focus-within:bg-primary group-focus-within:text-white group-focus-within:shadow-md group-focus-within:shadow-primary/20 ${compact ? "size-8" : "size-10"}`}
          >
            {icon}
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type="text"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
          value={value}
          min={min}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full bg-transparent outline-none ${compact ? "py-2.5 text-center text-base font-semibold sm:text-sm" : "py-5 text-base sm:text-sm"} ${theme === "light" ? "text-black placeholder:text-gray-400" : "text-white placeholder:text-gray-500"}`}
          onChange={handleChange}
          {...props}
        />

        <div
          className={`absolute bottom-0 left-0 h-px w-full transition-colors duration-300 ${error ? "bg-red-500" : theme === "light" ? "bg-black/20" : "bg-white/20"}`}
        />

        {!error && (
          <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-primary transition-all duration-300 ease-out group-focus-within:w-full" />
        )}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className={`${compact ? "mt-1.5" : "mt-2"} text-xs text-red-500`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default InputNumber;

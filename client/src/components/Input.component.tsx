import { type FC, type InputHTMLAttributes, type ReactNode } from "react";

// hooks
import { useTheme } from "../hooks";

interface IProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  endIcon?: ReactNode;
  endIconAriaLabel?: string;
  error?: string;
  className?: string;
  onEndIconClick?: () => void;
}

const Input: FC<IProps> = ({
  label,
  icon,
  endIcon,
  endIconAriaLabel,
  error,
  className,
  id,
  name,
  onEndIconClick,
  ...props
}) => {
  const { theme } = useTheme();

  const inputId: string = id || name || label || "";

  return (
    <div className={`w-full ${className || ""}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-2 block text-base font-semibold sm:text-sm ${theme === "light" ? "text-black" : "text-white"}`}
        >
          {label}
        </label>
      )}

      <div className="group relative flex items-center gap-3">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-focus-within:bg-primary group-focus-within:text-white group-focus-within:shadow-md group-focus-within:shadow-primary/20">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full bg-transparent py-5 text-base outline-none sm:text-sm ${theme === "light" ? "text-black placeholder:text-gray-400" : "text-white placeholder:text-gray-500"}`}
          {...props}
        />

        {endIcon &&
          (onEndIconClick ? (
            <button
              type="button"
              onClick={onEndIconClick}
              aria-label={endIconAriaLabel}
              title={endIconAriaLabel}
              className={`relative z-10 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-300 hover:bg-primary/10 hover:text-primary focus:outline-none ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}
            >
              {endIcon}
            </button>
          ) : (
            <div
              aria-hidden="true"
              className={`relative z-10 flex size-9 shrink-0 items-center justify-center ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}
            >
              {endIcon}
            </div>
          ))}

        <div
          className={`absolute bottom-0 left-0 h-px w-full transition-colors duration-300 ${error ? "bg-red-500" : theme === "light" ? "bg-black/20" : "bg-white/20"}`}
        />

        {!error && (
          <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-primary transition-all duration-300 ease-out group-focus-within:w-full" />
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;

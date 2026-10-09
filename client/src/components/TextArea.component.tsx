import {
  type FC,
  type ReactNode,
  type TextareaHTMLAttributes,
  useId,
} from "react";

// hooks
import { useTheme } from "../hooks";

interface IProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
  className?: string;
}

const TextArea: FC<IProps> = ({
  label,
  icon,
  error,
  className,
  id,
  name,
  ...props
}) => {
  const { theme } = useTheme();

  const generatedId: string = useId();
  const textareaId: string = id ?? name ?? generatedId;
  const errorId: string = `${textareaId}-error`;

  return (
    <div className={`w-full ${className ?? ""}`}>
      <label
        htmlFor={textareaId}
        className={`mb-2 block text-base font-semibold sm:text-sm ${
          theme === "light" ? "text-black" : "text-white"
        }`}
      >
        {label}
      </label>

      <div className="group relative flex items-start gap-3">
        {icon && (
          <div
            aria-hidden="true"
            className="mt-3 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-focus-within:bg-primary group-focus-within:text-white group-focus-within:shadow-md group-focus-within:shadow-primary/20"
          >
            {icon}
          </div>
        )}

        <textarea
          {...props}
          id={textareaId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-32 w-full resize-y bg-transparent py-5 text-base outline-none sm:text-sm ${
            theme === "light"
              ? "text-black placeholder:text-gray-400"
              : "text-white placeholder:text-gray-500"
          }`}
        />

        <div
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-px w-full transition-all duration-300 ${
            error
              ? "bg-red-500"
              : theme === "light"
                ? "bg-black/20"
                : "bg-white/20"
          }`}
        />

        {!error && (
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-primary transition-all duration-300 ease-out group-focus-within:w-full"
          />
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextArea;

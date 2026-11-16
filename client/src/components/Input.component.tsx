import { tr } from "../utils/ui-text";
import { allowsAutomaticTextFocus } from "../utils/input-focus.util";
import { type FC, type InputHTMLAttributes, type ReactNode } from "react";
import "../styles/v2/Fields.styles.css";

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
  autoFocus = false,
  ...props
}) => {
  const inputId: string = id || name || label || "";
  // Without a visible label the field is a search/filter box: glass capsule.
  const variant: "form" | "search" = label ? "form" : "search";

  return (
    <div
      className={`ui-field lg-field w-full ${className || ""}`}
      data-variant={variant}
      data-invalid={error ? true : undefined}
      data-disabled={props.disabled ? true : undefined}
    >
      {label && (
        <label htmlFor={inputId} className="ui-field-label lg-field__label">
          {label}
        </label>
      )}

      <div className="lg-field__control">
        {icon && (
          <span className="lg-field__icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="ui-field-control lg-field__input"
          {...props}
          autoFocus={autoFocus && allowsAutomaticTextFocus()}
        />

        {endIcon &&
          (onEndIconClick ? (
            <button
              type="button"
              disabled={props.disabled}
              onClick={onEndIconClick}
              aria-label={endIconAriaLabel}
              title={endIconAriaLabel}
              className="lg-field__action"
            >
              {endIcon}
            </button>
          ) : (
            <span aria-hidden="true" className="lg-field__icon lg-field__icon--end">
              {endIcon}
            </span>
          ))}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="lg-field__error">
          {tr(error)}
        </p>
      )}
    </div>
  );
};

export default Input;

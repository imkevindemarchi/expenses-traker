import { type CSSProperties } from "react";
import { useTheme } from "../hooks";
import "../styles/Stepper.styles.css";

interface Step {
  label: string;
  description?: string;
}

interface Props {
  steps: Step[];
  activeStep: number;
  ariaLabel: string;
  className?: string;
  accent?: string;
  disabled?: boolean;
  onStepClick?: (step: number) => void;
}

export default function Stepper({
  steps,
  activeStep,
  ariaLabel,
  className = "",
  accent = "var(--color-primary)",
  disabled = false,
  onStepClick,
}: Props) {
  const { theme } = useTheme();
  return (
    <nav
      className={`compact-stepper ${className}`}
      aria-label={ariaLabel}
      data-stepper-theme={theme}
      style={{ "--stepper-accent": accent } as CSSProperties}
    >
      <ol style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const current = index === activeStep;
          const content = (
            <>
              <span className="compact-stepper-track" aria-hidden="true" />
              <span className="compact-stepper-label">{step.label}</span>
              {step.description && (
                <span className="compact-stepper-description">{step.description}</span>
              )}
            </>
          );
          return (
            <li key={`${step.label}-${index}`} className={index <= activeStep ? "is-reached" : ""}>
              {onStepClick ? (
                <button
                  type="button"
                  disabled={disabled || index >= activeStep}
                  aria-current={current ? "step" : undefined}
                  onClick={() => onStepClick(index)}
                  className="compact-stepper-item"
                >
                  {content}
                </button>
              ) : (
                <div className="compact-stepper-item" aria-current={current ? "step" : undefined}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

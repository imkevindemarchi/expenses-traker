import { type FC } from "react";
import { Check } from "lucide-react";

// hooks
import { useTheme } from "../hooks";

interface IStepperStep {
  label: string;
  description?: string;
}

interface IProps {
  steps: IStepperStep[];
  activeStep: number;
  ariaLabel: string;
  className?: string;
}

const Stepper: FC<IProps> = ({
  steps,
  activeStep,
  ariaLabel,
  className = "",
}) => {
  const { theme } = useTheme();

  return (
    <div className={`w-full ${className}`} aria-label={ariaLabel}>
      <div className="flex w-full items-start">
        {steps.map((step: IStepperStep, index: number) => {
          const isCompleted: boolean = index < activeStep;
          const isActive: boolean = index === activeStep;
          const isLast: boolean = index === steps.length - 1;

          return (
            <div
              key={`${step.label}-${index}`}
              className="flex min-w-0 flex-1 items-start"
            >
              <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <span
                    className={`h-px flex-1 ${
                      index === 0
                        ? "bg-transparent"
                        : isCompleted || isActive
                          ? "bg-primary/55"
                          : theme === "light"
                            ? "bg-black/10"
                            : "bg-white/10"
                    }`}
                  />

                  <span
                    aria-current={isActive ? "step" : undefined}
                    className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 sm:size-10 ${
                      isCompleted
                        ? "border-primary bg-primary text-white"
                        : isActive
                          ? "border-primary bg-primary/12 text-primary ring-4 ring-primary/8"
                          : theme === "light"
                            ? "border-black/10 bg-white text-darkgray"
                            : "border-white/10 bg-white/4 text-gray"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={16} strokeWidth={2.6} />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span
                    className={`h-px flex-1 ${
                      isLast
                        ? "bg-transparent"
                        : isCompleted
                          ? "bg-primary/55"
                          : theme === "light"
                            ? "bg-black/10"
                            : "bg-white/10"
                    }`}
                  />
                </div>

                <div className="mt-2 min-w-0 px-1">
                  <p
                    className={`truncate text-[11px] font-semibold sm:text-xs ${
                      isActive || isCompleted
                        ? "text-primary"
                        : theme === "light"
                          ? "text-darkgray"
                          : "text-gray"
                    }`}
                  >
                    {step.label}
                  </p>

                  {step.description && (
                    <p
                      className={`mt-0.5 hidden truncate text-[10px] sm:block ${
                        theme === "light" ? "text-darkgray/70" : "text-gray/70"
                      }`}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;

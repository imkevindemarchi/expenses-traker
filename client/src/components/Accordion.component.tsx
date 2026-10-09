import { type FC, type ReactNode, useId, useState } from "react";
import { ChevronDown } from "lucide-react";

// hooks
import { useTheme } from "../hooks";

type TAccordionProps = {
  header: ReactNode;
  children: ReactNode;
  ariaLabel: string;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  chevronClassName?: string;
};

const Accordion: FC<TAccordionProps> = ({
  header,
  children,
  ariaLabel,
  defaultOpen = false,
  className = "",
  headerClassName = "",
  contentClassName = "",
  chevronClassName = "text-primary",
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const contentId: string = useId();

  return (
    <div className={`overflow-hidden ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={(): void =>
          setIsOpen((currentValue: boolean) => !currentValue)
        }
        className={`group/accordion flex w-full cursor-pointer items-center gap-3 text-left transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-200 ${headerClassName}`}
      >
        <span className="min-w-0 flex-1">{header}</span>

        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl border transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-200 group-hover/accordion:scale-105 ${
            theme === "light"
              ? "border-black/6 bg-white/70"
              : "border-white/7 bg-black/15"
          } ${chevronClassName}`}
        >
          <ChevronDown
            size={18}
            strokeWidth={2.2}
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        id={contentId}
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={contentClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Accordion;

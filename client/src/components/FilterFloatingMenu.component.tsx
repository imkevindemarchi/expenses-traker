import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";

// assets
import { getLiquidGlassClass } from "../assets/constants";

// components
import FloatingButton from "./FloatingButton.component";

// hooks
import { useTheme } from "../hooks";

// types
import type { TSelectOption } from "../types";

type TMenuPlacement = "side" | "above";

interface IProps<TValue extends string> {
  ariaLabel: string;
  icon: ReactNode;
  value: TValue;
  options: TSelectOption<TValue>[];
  optionCounts?: Partial<Record<TValue, number>>;
  isOpen: boolean;
  disabled?: boolean;
  placement?: TMenuPlacement;
  onToggle: () => void;
  onClose: () => void;
  onChange: (value: TValue) => void;
}

const FilterFloatingMenu = <TValue extends string>({
  ariaLabel,
  icon,
  value,
  options,
  optionCounts,
  isOpen,
  disabled = false,
  placement = "above",
  onToggle,
  onClose,
  onChange,
}: IProps<TValue>): ReactElement => {
  const { theme } = useTheme();
  const containerRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!isOpen)return;
    const outside=(event:PointerEvent)=>{if(!event.composedPath().includes(containerRef.current as EventTarget))onClose();};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();};
    document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape);};
  },[isOpen,onClose]);

  const menuPositionClassName: string =
    placement === "above"
      ? "bottom-[calc(100%+0.75rem)] left-1/2 max-h-[calc(100vh-7rem)] w-[min(19rem,calc(100vw-8rem))] origin-bottom sm:w-72"
      : "bottom-0 left-[calc(100%+0.75rem)] max-h-[calc(100vh-2rem)] w-[min(19rem,calc(100vw-6.5rem))] origin-left sm:bottom-[calc(100%+0.75rem)] sm:left-1/2 sm:top-auto sm:w-72 sm:origin-bottom";

  const menuVisibilityClassName: string =
    placement === "above"
      ? isOpen
        ? "pointer-events-auto -translate-x-1/2 translate-y-0 scale-100 opacity-100"
        : "pointer-events-none -translate-x-1/2 translate-y-3 scale-90 opacity-0"
      : isOpen
        ? "pointer-events-auto translate-x-0 scale-100 opacity-100 sm:-translate-x-1/2 sm:translate-y-0"
        : "pointer-events-none -translate-x-3 scale-90 opacity-0 sm:-translate-x-1/2 sm:translate-y-3";

  return (
    <div ref={containerRef} className="relative">
      <FloatingButton
        ariaLabel={ariaLabel}
        icon={icon}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
        className={isOpen ? "ring-2 ring-primary/35" : ""}
      />

      <div
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`liquid-glass-panel ${isOpen ? "liquid-glass-panel--open" : "liquid-glass-panel--closed"} absolute overflow-y-auto overscroll-contain rounded-[22px] border p-1.5 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuPositionClassName} ${menuVisibilityClassName} ${getLiquidGlassClass(theme)} ${
          theme === "light"
            ? "border-white/70 bg-white/50 shadow-[0_18px_50px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]"
            : "border-white/10 bg-black/70 shadow-[0_20px_55px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.08)]"
        }`}
      >
        <div role="menu" aria-label={ariaLabel} className="flex flex-col gap-1">
          {options.map((option: TSelectOption<TValue>) => {
            const isSelected: boolean = option.value === value;
            const count: number | undefined = optionCounts?.[option.value];

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={(): void => onChange(option.value)}
                className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : theme === "light"
                      ? "text-black hover:bg-black/5"
                      : "text-white hover:bg-white/7"
                }`}
              >
                {option.icon && (
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-white/15 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {option.icon}
                  </span>
                )}

                <span className="min-w-0 flex-1 truncate">{option.label}</span>

                {count !== undefined && (
                  <span
                    className={`flex min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                      isSelected
                        ? "bg-white/18 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {count}
                  </span>
                )}

                {isSelected && <CircleCheck size={17} strokeWidth={2.2} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FilterFloatingMenu;

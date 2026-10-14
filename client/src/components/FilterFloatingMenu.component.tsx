import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { CircleCheck } from "lucide-react";
import { getLiquidGlassClass } from "../assets/constants";
import FloatingButton from "./FloatingButton.component";
import { useTheme } from "../hooks";
import { fitStaticPanel } from "../utils/fitStaticPanel";
import type { TSelectOption } from "../types";
interface IProps<TValue extends string> {
  alwaysVisibleOnMobile?: boolean;
  ariaLabel: string;
  icon: ReactNode;
  value: TValue;
  options: TSelectOption<TValue>[];
  optionCounts?: Partial<Record<TValue, number>>;
  isOpen: boolean;
  disabled?: boolean;
  placement?: "side" | "above";
  onToggle: () => void;
  onClose?: () => void;
  onChange: (value: TValue) => void;
}
const FilterFloatingMenu = <TValue extends string>({
  alwaysVisibleOnMobile = false,
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
  const container = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({}),
    [columns, setColumns] = useState(1);
  useLayoutEffect(() => {
    if (!isOpen) return;
    let frame = 0;
    const update = () => {
      if (!container.current) return;
      const viewport = window.visualViewport ?? {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetLeft: 0,
        offsetTop: 0,
      };
      const nextColumns =
        options.length * 48 + 12 > viewport.height - 24 && options.length > 3 ? 2 : 1;
      setColumns(nextColumns);
      const height =
        nextColumns === columns
          ? (panel.current?.offsetHeight ?? options.length * 48 + 12)
          : Math.ceil(options.length / nextColumns) * 48 + 12;
      const nextPosition = fitStaticPanel(
          container.current.getBoundingClientRect(),
          304,
          Math.min(height, viewport.height - 24),
          viewport,
          placement === "side" && viewport.width < 640 ? "side" : "above",
        );
      const anchor = container.current.getBoundingClientRect();
      const originX = Math.max(0, Math.min(nextPosition.width, anchor.left + anchor.width / 2 - nextPosition.left));
      const originY = Math.max(0, Math.min(height, anchor.top + anchor.height / 2 - nextPosition.top));
      const positioned = { ...nextPosition, transformOrigin: `${originX}px ${originY}px`, "--menu-close-offset": nextPosition.top < anchor.top ? "8px" : "-8px" } as CSSProperties;
      setPosition(previous => previous.left === positioned.left && previous.top === positioned.top && previous.width === positioned.width && previous.transformOrigin === positioned.transformOrigin ? previous : positioned);
    };
    const close = () => {
      (onClose ?? onToggle)();
    };
    const outside = (event: PointerEvent) => {
      if (
        !container.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        container.current?.querySelector("button")?.focus();
      }
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    update();
    const observer = new ResizeObserver(scheduleUpdate);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleUpdate);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escape);
    };
  }, [isOpen, options.length, placement, columns, onClose, onToggle]);
  return (
    <div ref={container} className="relative">
      <FloatingButton
        alwaysVisibleOnMobile={alwaysVisibleOnMobile || isOpen}
        ariaLabel={ariaLabel}
        icon={icon}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
        className={isOpen ? "ring-2 ring-primary/35" : ""}
      />
      {createPortal(
        <div
          ref={panel}
          style={{ ...position, transform: isOpen ? "translateY(0) scale(1)" : "translateY(var(--menu-close-offset, 8px)) scale(0.96)", maxHeight: "calc(100dvh - 24px)", overflowY: "auto" }}
          aria-hidden={!isOpen}
          inert={!isOpen}
          className={`liquid-glass-panel ${isOpen ? "liquid-glass-panel--open pointer-events-auto opacity-100" : "liquid-glass-panel--closed pointer-events-none opacity-0"} fixed z-9999 overflow-hidden rounded-[22px] border p-1.5 transition-[background-color,border-color,box-shadow,opacity,transform] duration-300 ${getLiquidGlassClass(theme)} ${theme === "light" ? "border-white/70 bg-white/50 shadow-[0_18px_50px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]" : "border-white/10 bg-black/70 shadow-[0_20px_55px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.08)]"}`}
        >
          <div
            role="menu"
            aria-label={ariaLabel}
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }}
          >
            {options.map((option) => {
              const selected = option.value === value,
                count = optionCounts?.[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  title={option.label}
                  onClick={() => onChange(option.value)}
                  className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors ${selected ? "bg-primary text-white" : theme === "light" ? "text-black hover:bg-black/5" : "text-white hover:bg-white/7"}`}
                >
                  {option.icon && (
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {count !== undefined && (
                    <span
                      className={`flex min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${selected ? "bg-white/18 text-white" : "bg-primary/10 text-primary"}`}
                    >
                      {count}
                    </span>
                  )}
                  {selected && <CircleCheck size={17} strokeWidth={2.2} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
export default FilterFloatingMenu;

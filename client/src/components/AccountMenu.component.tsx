import { useNavigate } from 'react-router';
import {
  type CSSProperties,
  type FC,
  useCallback,
  useEffect,
  useRef,
  useState,
  useContext,
} from "react";
import { ChevronDown, LogOut, Settings, UserRound, Mail, Monitor, Moon, Sun } from "lucide-react";
import {ThemeContext} from '../contexts/theme.context';
import {tr} from '../i18n';
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";


// assets
import { getLiquidGlassClass } from "../assets/constants";

// hooks
import { useTheme } from "../hooks";

// utils


type TMenuPlacement = "top" | "bottom";
type TMenuAlignment = "left" | "right";

interface IProps {
 username: string; surname?: string; email: string; onLogout: () => void;
  className?: string;
  placement?: TMenuPlacement;
  alignment?: TMenuAlignment;
}

const MENU_GAP = 8;
const MENU_MIN_WIDTH = 360;
const VIEWPORT_PADDING = 12;

const AccountMenu: FC<IProps> = ({
  username, surname='', email, onLogout,
  className = "",
  placement = "bottom",
  alignment = "right",
}) => {


  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {preference,setPreference}=useContext(ThemeContext);
  const fullName=[username,surname].map(value=>value.trim()).filter(Boolean).join(' ');
  const initials=[username,surname].filter(value=>value.trim()).map(value=>value.trim().charAt(0)).join('').toLocaleUpperCase();

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [menuOrigin, setMenuOrigin] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });



  const isMenuOnTop: boolean = placement === "top";
  const isMenuAlignedLeft: boolean = alignment === "left";

  const updateMenuPosition = useCallback((): void => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect: DOMRect = triggerRef.current.getBoundingClientRect();

    const availableWidth: number = window.innerWidth - VIEWPORT_PADDING * 2;

    const menuWidth: number = Math.min(
      Math.max(triggerRect.width, MENU_MIN_WIDTH),
      availableWidth,
    );

    const menuHeight: number = menuRef.current?.scrollHeight ?? 120;

    const preferredLeft: number = isMenuAlignedLeft
      ? triggerRect.left
      : triggerRect.right - menuWidth;

    const clampedLeft: number = Math.min(
      Math.max(preferredLeft, VIEWPORT_PADDING),
      window.innerWidth - menuWidth - VIEWPORT_PADDING,
    );

    const preferredTop: number = isMenuOnTop
      ? triggerRect.top - menuHeight - MENU_GAP
      : triggerRect.bottom + MENU_GAP;

    const clampedTop: number = Math.min(
      Math.max(preferredTop, VIEWPORT_PADDING),
      window.innerHeight - menuHeight - VIEWPORT_PADDING,
    );

    const triggerAnchorX: number = isMenuAlignedLeft
      ? triggerRect.left + 28
      : triggerRect.right - 28;

    setMenuOrigin({
      x: Math.min(Math.max(triggerAnchorX - clampedLeft, 0), menuWidth),
      y: isMenuOnTop ? menuHeight : 0,
    });

    setMenuStyle({
      left: clampedLeft,
      top: clampedTop,
      width: menuWidth,
    });
  }, [isMenuAlignedLeft, isMenuOnTop]);

  const handleToggleMenu = (): void => {
    if (!isOpen) {
      updateMenuPosition();
    }

    setIsOpen((previousValue: boolean): boolean => !previousValue);
  };



  const handleLogout = (): void => {
    setIsOpen(false);

    onLogout();
  };

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent): void => {
      const target: Node = event.target as Node;

      if (
        isOpen &&
        !accountMenuRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return (): void => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return (): void => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  return (
    <>
      <div
        ref={accountMenuRef}
        data-glass-theme={theme}
        className={`group relative isolate overflow-hidden rounded-full ${getLiquidGlassClass(theme)} ${className}`}
      >
        {/* <span className="pointer-events-none absolute inset-px rounded-full bg-linear-to-b from-white/30 via-white/5 to-transparent opacity-70 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:inset-0 group-hover:opacity-100" />

        <span className="pointer-events-none absolute -left-6 -top-8 size-16 rounded-full bg-white/45 blur-xl transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-700 ease-out group-hover:translate-x-10 group-hover:translate-y-8 group-hover:scale-125" />

        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:ring-white/40" /> */}

        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggleMenu}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={
            isOpen ? t("accountMenu.closeMenu") : t("accountMenu.openMenu")
          }
          className={`liquid-glass-interaction relative z-10 flex cursor-pointer items-center gap-3 rounded-full border px-3 py-2 text-left outline-none transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.9] ${
            isOpen
              ? "border-primary/40 ring-4 ring-primary/8"
              : theme === "light"
                ? "border-black/7 hover:border-black/12"
                : "border-white/8 hover:border-white/15"
          } ${
            theme === "light"
              ? "text-black"
              : "text-white"
          }`}
        >
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-110 ${
              isOpen
                ? "bg-primary text-white shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                : "bg-primary/10 text-primary"
            }`}
          >
            {initials?<span className="text-xs font-semibold">{initials}</span>:<UserRound size={18} strokeWidth={1.7} />}
          </span>

          <span className="min-w-0 flex-1 text-left transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.03]">
            <span className="block max-w-32 truncate text-sm font-semibold">
              {fullName||email}
            </span>
            {fullName&&<span className="block max-w-32 truncate text-[10px] opacity-60">{email}</span>}
          </span>

          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className={`shrink-0 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-y-0.5 group-hover:scale-110 ${
              isOpen
                ? "rotate-180 text-primary"
                : theme === "light"
                  ? "rotate-0 text-darkgray"
                  : "rotate-0 text-gray"
            }`}
          />
        </button>
      </div>

      {createPortal(
        <div
          ref={menuRef}
        data-glass-theme={theme}
          inert={!isOpen}
          role="menu"
          aria-label={t("accountMenu.menuLabel")}
          style={{
            ...menuStyle,
            transform: isOpen
              ? "translateY(0) scale(1)"
              : `translateY(${isMenuOnTop ? "8px" : "-8px"}) scale(0.96)`,
            transformOrigin: `${menuOrigin.x}px ${menuOrigin.y}px`,
          }}
          className={`liquid-glass-panel glass-surface--clear ${isOpen ? "liquid-glass-panel--open" : "liquid-glass-panel--closed"} fixed z-9999 isolate overflow-hidden rounded-[22px] border p-1.5 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity] ${
            theme === "light" ? "border-black/7" : "border-white/8"
          } ${getLiquidGlassClass(theme)} ${
            isOpen
              ? "pointer-events-auto rounded-[22px] opacity-100"
              : "pointer-events-none rounded-[22px] opacity-0"
          }`}
        >
          <div className="account-menu-profile" role="presentation"><div className="account-menu-identity">{fullName&&<strong>{fullName}</strong>}<span className="account-menu-email"><Mail size={13}/><span title={email}>{email}</span></span></div></div>
          <div className="relative z-10 flex flex-col gap-1">
            <div
              role="group"
              aria-label={tr('Tema')}
              className={`border-b px-3 pt-2 pb-3 ${theme === "light" ? "border-black/7 text-black" : "border-white/8 text-white"}`}
            >
              <span className="mb-2 block text-xs font-semibold opacity-65">
                {tr('Tema')}
              </span>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { value: "system", label: "Sistema", icon: Monitor },
                  { value: "dark", label: "Scuro", icon: Moon },
                  { value: "light", label: "Chiaro", icon: Sun },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={preference === value}
                    onClick={() => setPreference(value)}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                      preference === value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : theme === "light"
                          ? "border-transparent hover:bg-black/5"
                          : "border-transparent hover:bg-white/6"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.7} />
                    <span>{tr(label)}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="button" role="menuitem" onClick={() => {setIsOpen(false);navigate('/settings');}} className={`group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left text-sm transition-all duration-300 ${theme === 'light' ? 'text-black hover:border-white/65 hover:bg-white/40' : 'text-white hover:border-white/8 hover:bg-white/6'}`}><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings size={17} strokeWidth={1.7}/></span><span className="font-semibold">{t('accountMenu.settings')}</span></button>
            

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left text-sm transition-[background-color,border-color,color] duration-300 ${
                theme === "light"
                  ? "text-red-600 hover:border-red-500/10 hover:bg-red-500/8"
                  : "text-red-400 hover:border-red-400/10 hover:bg-red-500/8"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <LogOut size={17} strokeWidth={1.7} />
              </span>

              <span className="font-semibold">{t("accountMenu.logout")}</span>
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default AccountMenu;

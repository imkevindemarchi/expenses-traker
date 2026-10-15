import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Check, ChevronRight, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../styles/ModalChoiceField.styles.css";

type Props<T> = {
  id?: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  value: T | null;
  options: T[];
  disabled?: boolean;
  isLoading?: boolean;
  clearable?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  error?: string;
  icon?: ReactNode;
  getOptionKey: (item: T) => string;
  getOptionLabel: (item: T) => string;
  getOptionDescription?: (item: T) => string | undefined;
  getOptionIcon?: (item: T) => ReactNode;
  onChange: (item: T | null) => void;
  onSearchChange?: (value: string) => void;
};

/** A focused selection view inside the existing dialog, with no second dialog or dropdown. */
export default function ModalChoiceField<T>({
  id,
  label,
  placeholder,
  searchPlaceholder,
  value,
  options,
  disabled,
  isLoading,
  clearable = true,
  emptyMessage,
  loadingMessage,
  error,
  icon,
  getOptionKey,
  getOptionLabel,
  getOptionDescription,
  getOptionIcon,
  onChange,
  onSearchChange,
}: Props<T>) {
  const { t } = useTranslation();
  const uid = useId();
  const title = label || placeholder || t("autocomplete.placeholder");
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const titleId = `${uid}-title`;
  const visible = useMemo(() => {
    if (onSearchChange || !search.trim()) return options;
    const query = search.trim().toLocaleLowerCase();
    return options.filter((item) =>
      `${getOptionLabel(item)} ${getOptionDescription?.(item) ?? ""}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [options, search, onSearchChange, getOptionLabel, getOptionDescription]);
  const close = () => {
    setOpen(false);
    setSearch("");
    onSearchChange?.("");
  };
  const choose = (item: T | null) => {
    onChange(item);
    close();
  };
  useLayoutEffect(() => {
    if (!open || !host || !panel.current) return;
    const oldLabel = host.getAttribute("aria-labelledby");
    const oldDescription = host.getAttribute("aria-describedby");
    const siblings = Array.from(host.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child !== panel.current,
    );
    const prior = siblings.map((element) => ({
      element,
      inert: element.inert,
      hidden: element.getAttribute("aria-hidden"),
    }));
    prior.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    host.dataset.choiceOpen = "true";
    host.setAttribute("aria-labelledby", titleId);
    host.removeAttribute("aria-describedby");
    searchInput.current?.focus({ preventScroll: true });
    return () => {
      delete host.dataset.choiceOpen;
      prior.forEach(({ element, inert, hidden }) => {
        element.inert = inert;
        if (hidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", hidden);
      });
      if (oldLabel === null) host.removeAttribute("aria-labelledby");
      else host.setAttribute("aria-labelledby", oldLabel);
      if (oldDescription !== null) host.setAttribute("aria-describedby", oldDescription);
      if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
    };
  }, [open, host, titleId]);
  const navigate = (event: KeyboardEvent, index: number) => {
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>(
      '[role="option"]:not(:disabled)',
    );
    if (!buttons?.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      buttons[
        (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length
      ]?.focus();
    }
  };
  return (
    <>
      <div className="modal-choice-field">
        {label && (
          <span id={`${uid}-label`} className="modal-choice-label">
            {label}
          </span>
        )}
        <button
          ref={trigger}
          id={id}
          type="button"
          disabled={disabled}
          className="modal-choice-trigger"
          aria-labelledby={label ? `${uid}-label ${uid}-value` : undefined}
          aria-label={!label ? title : undefined}
          aria-expanded={open}
          aria-controls={`${uid}-panel`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${uid}-error` : undefined}
          onClick={() => {
            const dialog = trigger.current?.closest<HTMLElement>('[role="dialog"]');
            if (!dialog) return;
            setHost(dialog);
            setSearch("");
            onSearchChange?.("");
            setOpen(true);
          }}
        >
          {(icon || (value && getOptionIcon?.(value))) && (
            <span className="modal-choice-trigger-icon">
              {icon || (value && getOptionIcon?.(value))}
            </span>
          )}
          <span id={`${uid}-value`} className={value ? "" : "modal-choice-placeholder"}>
            {value ? getOptionLabel(value) : placeholder || t("autocomplete.placeholder")}
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        {error && (
          <p id={`${uid}-error`} role="alert" className="modal-choice-error">
            {error}
          </p>
        )}
      </div>
      {open &&
        host &&
        createPortal(
          <div
            ref={panel}
            id={`${uid}-panel`}
            className="modal-choice-view"
            onKeyDownCapture={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                close();
              }
            }}
          >
            <div className="modal-choice-header">
              <button
                type="button"
                className="modal-choice-back"
                aria-label={t("modalChoice.back")}
                onClick={close}
              >
                <ArrowLeft size={20} aria-hidden="true" />
              </button>
              <h2 id={titleId}>{title}</h2>
            </div>
            <div className="modal-choice-search">
              <Search size={18} aria-hidden="true" />
              <input
                ref={searchInput}
                type="search"
                name={`${uid}-lookup-query`}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-label={searchPlaceholder || t("autocomplete.searchPlaceholder")}
                placeholder={searchPlaceholder || t("autocomplete.searchPlaceholder")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  onSearchChange?.(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (!isLoading && visible.length === 1) choose(visible[0]);
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    list.current
                      ?.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)')
                      ?.focus();
                  }
                }}
              />
            </div>
            <div
              ref={list}
              role="listbox"
              aria-label={title}
              aria-busy={isLoading}
              className="modal-choice-options"
            >
              {isLoading ? (
                <p className="modal-choice-status" role="status">
                  {loadingMessage || t("autocomplete.loadingMessage")}
                </p>
              ) : !visible.length ? (
                <p className="modal-choice-status">
                  {emptyMessage || t("autocomplete.emptyMessage")}
                </p>
              ) : (
                visible.map((item, index) => {
                  const selected = value !== null && getOptionKey(value) === getOptionKey(item);
                  const optionIcon = getOptionIcon?.(item);
                  const description = getOptionDescription?.(item);
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      key={getOptionKey(item)}
                      className="modal-choice-option"
                      onKeyDown={(event) => navigate(event, index)}
                      onClick={() => choose(item)}
                    >
                      {optionIcon && <span className="modal-choice-option-icon">{optionIcon}</span>}
                      <span>
                        <strong>{getOptionLabel(item)}</strong>
                        {description && <small>{description}</small>}
                      </span>
                      {selected && <Check size={18} aria-hidden="true" />}
                    </button>
                  );
                })
              )}
            </div>
            {clearable && value && (
              <div className="modal-choice-footer">
                <button type="button" onClick={() => choose(null)}>
                  <X size={16} aria-hidden="true" />
                  {t("modalChoice.clear")}
                </button>
              </div>
            )}
          </div>,
          host,
        )}
    </>
  );
}

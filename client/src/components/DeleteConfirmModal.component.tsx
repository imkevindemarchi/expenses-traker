import { useEffect, useState, type FC, type ReactNode } from "react";
import { Info, Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "./Button.component";
import Input from "./Input.component";
import Modal from "./Modal.component";

interface IProps {
  isOpen: boolean;
  title: string;
  description?: string;
  warning: string;
  /** The record being deleted, as an iOS row (thumbnail / avatar, name, detail). */
  preview?: { media: ReactNode; title: ReactNode; detail?: ReactNode };
  isDeleting: boolean;
  /** Label of the red button (default "Delete"), e.g. "Remove" or "Duplicate". */
  confirmLabel?: string;
  deletingLabel?: string;
  /** "default": a neutral confirmation (e.g. duplicate) with a tinted button. */
  tone?: "danger" | "default";
  /** Icon of the confirm button (default: trash). */
  confirmIcon?: ReactNode;
  /** Label of the neutral button (default "Cancel"). */
  cancelLabel?: string;
  /**
   * Final deletions (an account): the red button stays off until the word
   * "conferma" / "confirm" (in the current language) is typed in the field.
   */
  requireConfirmWord?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * One confirmation sheet for every destructive action, identical in the three
 * apps (the "discard workout" sheet of Gym Traker): the record as an iOS row,
 * the warning in red, then "Cancel" and the red action. Opened over a page or
 * over another sheet (InlineDeleteConfirm).
 */
const DeleteConfirmModal: FC<IProps> = ({
  isOpen,
  title,
  description,
  warning,
  preview,
  isDeleting,
  confirmLabel,
  deletingLabel,
  tone = "danger",
  confirmIcon,
  cancelLabel,
  requireConfirmWord = false,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const confirmWord = t("common.confirmWord");
  const [typed, setTyped] = useState("");
  // Every opening starts with an empty field.
  useEffect(() => {
    if (!isOpen) setTyped("");
  }, [isOpen]);
  const wordMatches =
    !requireConfirmWord ||
    typed.trim().toLocaleLowerCase() === confirmWord.toLocaleLowerCase();
  const confirm = (): void => {
    if (!isDeleting && wordMatches) onConfirm();
  };

  return (
    <Modal
      intent={tone === "danger" ? "danger" : "default"}
      isOpen={isOpen}
      title={title}
      description={description}
      isClosable={!isDeleting}
      closeOnBackdropClick={!isDeleting}
      onClose={onClose}
      footer={
        <div className="modal-confirm-actions">
          <Button type="button" variant="secondary" disabled={isDeleting} onClick={onClose}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            disabled={isDeleting || !wordMatches}
            icon={isDeleting ? undefined : (confirmIcon ?? <Trash2 size={17} strokeWidth={2} />)}
            onClick={confirm}
          >
            {isDeleting
              ? (deletingLabel ?? t("common.deleting"))
              : (confirmLabel ?? t("common.delete"))}
          </Button>
        </div>
      }
    >
      <div className="ios-delete">
        {preview && (
          <div className="ios-delete__record">
            <span className="ios-delete__media" aria-hidden="true">
              {preview.media}
            </span>
            <span className="ios-delete__copy">
              <strong>{preview.title}</strong>
              {preview.detail && <small>{preview.detail}</small>}
            </span>
          </div>
        )}
        <p className="ios-delete__warning" data-tone={tone}>
          {tone === "danger" ? (
            <TriangleAlert size={18} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Info size={18} strokeWidth={2} aria-hidden="true" />
          )}
          <span>{warning}</span>
        </p>
        {requireConfirmWord && (
          <form
            className="ios-delete__type"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              confirm();
            }}
          >
            <Input
              id="delete-confirm-word"
              label={t("common.typeToConfirm", { word: confirmWord })}
              placeholder={confirmWord}
              value={typed}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              disabled={isDeleting}
              onChange={(event) => setTyped(event.target.value)}
            />
          </form>
        )}
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;

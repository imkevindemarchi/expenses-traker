import type { FC, ReactNode } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal.component";

interface IProps {
  /** Title of the confirmation sheet. */
  title: string;
  /** What is deleted and that it is final. */
  message: string;
  confirmLabel: string;
  deletingLabel: string;
  cancelLabel: string;
  isDeleting: boolean;
  /** The record being deleted, as an iOS row (icon, name, detail). */
  preview?: { media: ReactNode; title: ReactNode; detail?: ReactNode };
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Deletion asked from inside a sheet (a record's editor or details): the same
 * confirmation sheet as every other deletion (DeleteConfirmModal, the "discard
 * workout" sheet of Gym Traker), opened over the sheet; the sheet underneath
 * keeps its own buttons. Rendered while the confirmation is requested.
 */
const InlineDeleteConfirm: FC<IProps> = ({
  title,
  message,
  confirmLabel,
  deletingLabel,
  cancelLabel,
  isDeleting,
  preview,
  onCancel,
  onConfirm,
}) => (
  <DeleteConfirmModal
    isOpen
    title={title}
    warning={message}
    preview={preview}
    confirmLabel={confirmLabel}
    deletingLabel={deletingLabel}
    cancelLabel={cancelLabel}
    isDeleting={isDeleting}
    onClose={onCancel}
    onConfirm={onConfirm}
  />
);

export default InlineDeleteConfirm;

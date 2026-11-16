import type { FC } from "react";
import { Trash2 } from "lucide-react";
import Button from "./Button.component";

interface IProps {
  /** Names the confirmation for assistive technologies. */
  title: string;
  /** One short line above the buttons: what is deleted and that it is final. */
  message: string;
  confirmLabel: string;
  deletingLabel: string;
  cancelLabel: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Delete confirmation inside the footer of the sheet that edits the record,
 * as an iOS action sheet: a short line, then "Delete" (red) and "Cancel"
 * stacked at full width. Shared by every modal with deletion built in.
 */
const InlineDeleteConfirm: FC<IProps> = ({
  title,
  message,
  confirmLabel,
  deletingLabel,
  cancelLabel,
  isDeleting,
  onCancel,
  onConfirm,
}) => (
  <div className="modal-delete-sheet" role="alertdialog" aria-label={title}>
    <p className="modal-delete-sheet__message">{message}</p>
    <Button type="button" variant="danger" disabled={isDeleting} onClick={onConfirm}>
      {!isDeleting && <Trash2 size={17} strokeWidth={2} />}
      <span>{isDeleting ? deletingLabel : confirmLabel}</span>
    </Button>
    <Button type="button" variant="secondary" disabled={isDeleting} onClick={onCancel}>
      <span>{cancelLabel}</span>
    </Button>
  </div>
);

export default InlineDeleteConfirm;

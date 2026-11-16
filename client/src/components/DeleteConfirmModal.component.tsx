import type { FC, ReactNode } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "./Button.component";
import Modal from "./Modal.component";

interface IProps {
  isOpen: boolean;
  title: string;
  description?: string;
  warning: string;
  /** The record being deleted, as an iOS row (thumbnail / avatar, name, detail). */
  preview?: { media: ReactNode; title: ReactNode; detail?: ReactNode };
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** One confirmation sheet for every destructive action on a record. */
const DeleteConfirmModal: FC<IProps> = ({
  isOpen,
  title,
  description,
  warning,
  preview,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      intent="danger"
      isOpen={isOpen}
      title={title}
      description={description}
      isClosable={!isDeleting}
      closeOnBackdropClick={!isDeleting}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={isDeleting} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isDeleting}
            icon={isDeleting ? undefined : <Trash2 size={17} strokeWidth={2} />}
            onClick={onConfirm}
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </>
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
        <p className="ios-delete__warning">
          <TriangleAlert size={18} strokeWidth={2} aria-hidden="true" />
          <span>{warning}</span>
        </p>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;

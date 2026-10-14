import { type ChangeEventHandler } from "react";
import { CalendarPlus, Check, Gift, Image, UserRound, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import Input from "./Input.component";
import DatePicker from "./DatePicker.component";
import "../styles/ManualPurchase.styles.css";

type PurchaseType = "tip" | "video" | "photo";
interface Props {
  type: PurchaseType;
  amount: string;
  date: Date | null;
  name: string;
  username: string;
  amountError: string;
  busy: boolean;
  onTypeChange: (type: PurchaseType) => void;
  onAmountChange: ChangeEventHandler<HTMLInputElement>;
  onDateChange: (date: Date | null) => void;
}

export default function ManualPurchaseFields({
  type,
  amount,
  date,
  name,
  username,
  amountError,
  busy,
  onTypeChange,
  onAmountChange,
  onDateChange,
}: Props) {
  const { t } = useTranslation();
  const options = [
    { type: "tip" as const, label: t("userManagement.manualPurchase.types.tip"), Icon: Gift },
    { type: "video" as const, label: t("userManagement.manualPurchase.types.video"), Icon: Video },
    { type: "photo" as const, label: t("userManagement.manualPurchase.types.photo"), Icon: Image },
  ];
  return (
    <fieldset disabled={busy} className="manual-purchase-fields">
      <legend className="sr-only">{t("userManagement.manualPurchase.title")}</legend>
      <div className="manual-purchase-recipient">
        <span className="manual-purchase-avatar">
          <UserRound size={20} aria-hidden="true" />
        </span>
        <div>
          <strong>{name || username}</strong>
          {name && username && <span>{username.startsWith("@") ? username : `@${username}`}</span>}
        </div>
      </div>
      <div className="manual-purchase-type">
        <p id="manual-purchase-type-label">{t("userManagement.manualPurchase.type")}</p>
        <div
          className="manual-purchase-options"
          role="group"
          aria-labelledby="manual-purchase-type-label"
        >
          {options.map(({ type: optionType, label, Icon }) => (
            <button
              type="button"
              key={optionType}
              className="manual-purchase-option"
              aria-pressed={type === optionType}
              onClick={() => onTypeChange(optionType)}
            >
              <span className="manual-purchase-option-icon">
                <Icon size={23} aria-hidden="true" />
              </span>
              <span>{label}</span>
              {type === optionType && (
                <Check className="manual-purchase-check" size={15} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="manual-purchase-amount">
        <Input
          id="manual_purchase_amount"
          name="manual_purchase_amount"
          type="text"
          label={t("userManagement.manualPurchase.amount")}
          placeholder={t("userManagement.manualPurchase.amountPlaceholder")}
          value={amount}
          error={amountError}
          onChange={onAmountChange}
          disabled={busy}
          inputMode="decimal"
          autoComplete="off"
          endIcon={<span className="manual-purchase-currency">$</span>}
        />
      </div>
      <div className="manual-purchase-date">
        <DatePicker
          id="manual_purchase_date"
          name="manual_purchase_date"
          label={t("userManagement.date")}
          value={date}
          icon={<CalendarPlus size={18} aria-hidden="true" />}
          disabled={busy}
          onChange={onDateChange}
        />
      </div>
    </fieldset>
  );
}

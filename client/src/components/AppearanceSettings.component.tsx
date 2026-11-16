import { type ChangeEvent, type CSSProperties, type FC, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  GLASS_CLARITY_EVENT,
  getGlassClarity,
  setGlassClarity,
} from "../utils/glass-clarity.util";

/** Settings → Appearance: the Liquid Glass clarity slider (iOS 27 style). */
const AppearanceSettings: FC = () => {
  const { t } = useTranslation();
  const sliderId = useId();
  const hintId = useId();
  const titleId = useId();
  const [clarity, setClarity] = useState<number>(getGlassClarity);

  // The value saved on the account can arrive after the page opens.
  useEffect(() => {
    const sync = (event: Event): void => {
      const value = (event as CustomEvent<number>).detail;
      if (typeof value === "number") setClarity(value);
    };
    window.addEventListener(GLASS_CLARITY_EVENT, sync);
    return () => window.removeEventListener(GLASS_CLARITY_EVENT, sync);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = Number(event.target.value) / 100;
    setClarity(value);
    setGlassClarity(value);
  };

  return (
    <section
      id="settings-appearance"
      tabIndex={-1}
      aria-labelledby={titleId}
      className="ios-group"
    >
      <div className="ios-group__head">
        <h2 id={titleId} className="ios-group__title">
          {t("settings.appearance.title")}
        </h2>
      </div>

      <div className="ios-group__card ios-group__card--padded lg-clarity">
        <div className="lg-clarity__preview" aria-hidden="true">
          <span className="lg-clarity__stripes" />
          <span className="lg-clarity__glass lg-glass">{t("settings.appearance.preview")}</span>
        </div>

        <label htmlFor={sliderId} className="lg-clarity__label">
          {t("settings.appearance.glass")}
        </label>
        <div className="lg-clarity__row">
          <span className="lg-clarity__end">{t("settings.appearance.frosted")}</span>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(clarity * 100)}
            onChange={handleChange}
            aria-describedby={hintId}
            aria-valuetext={`${Math.round(clarity * 100)}%`}
            className="lg-slider"
            style={{ "--lg-slider-value": `${clarity * 100}%` } as CSSProperties}
          />
          <span className="lg-clarity__end">{t("settings.appearance.clear")}</span>
        </div>
      </div>
      <p id={hintId} className="ios-group__footer">
        {t("settings.appearance.glassHint")}
      </p>
    </section>
  );
};

export default AppearanceSettings;

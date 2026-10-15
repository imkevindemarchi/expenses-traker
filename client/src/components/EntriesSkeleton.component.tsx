import { FieldSkeleton, Placeholder, SkeletonStatus } from "./UiSkeleton.component";
import { tr } from "../i18n";
import { useContext } from "react";
import { CurrencyContext } from "../contexts/currency.context";
import "../styles/EntryCards.styles.css";
import "../styles/EntriesSkeleton.styles.css";
import "../styles/Settings.styles.css";
import "../styles/DeleteConfirmation.styles.css";
import "../styles/SectionNavigation.styles.css";

export function PaginationSkeleton() {
  return <div className="sk-entry-pagination" aria-hidden="true"><Placeholder className="sk-entry-page" /><Placeholder className="sk-entry-page-size" /><Placeholder className="sk-entry-page" /></div>;
}

export default function EntriesSkeleton({ count = 3 }: { count?: number }) {
  const currency = useContext(CurrencyContext);
  return <SkeletonStatus layout="entries"><div className="entry-cards">{Array.from({ length: count }, (_, index) => <article className="entry-card sk-entry-card" key={index}><div className="entry-card-main"><Placeholder className="entry-card-icon" /><Placeholder className="sk-text" /><div className="entry-card-actions"><Placeholder className="sk-entry-action" /><Placeholder className="sk-entry-action" /></div></div><div className="entry-card-footer"><div className="entry-card-meta"><Placeholder className="sk-caption" /><Placeholder className="sk-caption" /></div><Placeholder className="sk-entry-amount" /></div></article>)}</div><table className="entry-table entry-table--desktop"><thead><tr>{["Azioni", "Tipo", "Movimento", "Importo {{currency}}"].map(label => <th scope="col" key={label}>{tr(label, { currency })}</th>)}</tr></thead><tbody>{Array.from({ length: count }, (_, index) => <tr className="entry-row" key={index}><td className="entry-actions"><Placeholder className="sk-entry-action" /><Placeholder className="sk-entry-action" /></td><td><Placeholder className="entry-icon" /></td><td className="entry-description"><Placeholder className="sk-text" /><Placeholder className="sk-caption" /></td><td className="entry-amount"><Placeholder className="sk-entry-amount" /></td></tr>)}</tbody></table></SkeletonStatus>;
}

function SettingsHeadingSkeleton() {
  return <div className="settings-section-heading"><Placeholder className="settings-section-icon sk-settings-icon" /><div className="sk-grow"><Placeholder className="sk-section-title" /><Placeholder className="sk-caption" /></div></div>;
}

export function SettingsPageSkeleton() {
  return <SkeletonStatus layout="expense-settings"><div className="subscription-settings-page"><div className="settings-layout">
    <aside className="settings-navigation" aria-hidden="true"><Placeholder className="settings-navigation-label sk-label" />{[0,1,2,3].map(index => <Placeholder className="sk-entry-navigation" key={index} />)}</aside>
    <div className="settings-sections settings-redesign">
      {[0,1,2,3].map(index => <section className="settings-section" key={index}>
        <SettingsHeadingSkeleton />
        <div className="settings-section-body">
          {index === 0 ? <div className="form-stack"><div className="settings-profile-fields grid sk-settings-fields"><FieldSkeleton /><FieldSkeleton /></div></div>
          : index === 1 ? <div className="form-stack"><FieldSkeleton /><Placeholder className="sk-settings-note" /><FieldSkeleton /><Placeholder className="sk-settings-note sk-settings-note--long" /></div>
          : index === 2 ? <Placeholder className="settings-password-toggle sk-settings-toggle" />
          : <><div className="settings-data-card"><div className="settings-data-heading"><Placeholder className="settings-data-icon" /><div className="settings-data-copy sk-grow"><Placeholder className="sk-text" /><Placeholder className="sk-settings-note" /></div></div><div className="settings-data-actions"><Placeholder className="sk-settings-button" /><Placeholder className="sk-settings-button" /></div><Placeholder className="sk-settings-note sk-settings-note--long settings-data-note" /></div><div className="settings-delete-box"><div className="settings-delete-row"><Placeholder className="settings-delete-icon" /><div className="settings-delete-copy sk-grow"><Placeholder className="sk-text" /><Placeholder className="sk-settings-note" /></div></div><div className="settings-delete-actions"><Placeholder className="sk-settings-button" /></div></div></>}
        </div>
      </section>)}
    </div>
  </div></div></SkeletonStatus>;
}

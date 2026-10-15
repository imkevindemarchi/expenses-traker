import { Placeholder, SkeletonStatus } from "./UiSkeleton.component";
import { tr } from "../i18n";
import "../styles/EntryCards.styles.css";
import "../styles/EntriesSkeleton.styles.css";
import "../styles/Settings.styles.css";
import "../styles/SectionNavigation.styles.css";

export function PaginationSkeleton() {
  return <div className="sk-entry-pagination" aria-hidden="true"><Placeholder className="sk-entry-page" /><Placeholder className="sk-entry-page-size" /><Placeholder className="sk-entry-page" /></div>;
}

export default function EntriesSkeleton({ count = 3 }: { count?: number }) {
  return <SkeletonStatus layout="entries"><div className="entry-cards">{Array.from({ length: count }, (_, index) => <article className="entry-card sk-entry-card" key={index}><div className="entry-card-main"><Placeholder className="entry-card-icon" /><Placeholder className="sk-text" /><div className="entry-card-actions"><Placeholder className="sk-entry-action" /><Placeholder className="sk-entry-action" /></div></div><div className="entry-card-footer"><div className="entry-card-meta"><Placeholder className="sk-caption" /><Placeholder className="sk-caption" /></div><Placeholder className="sk-entry-amount" /></div></article>)}</div><table className="entry-table entry-table--desktop"><thead><tr>{["Azioni", "Tipo", "Movimento", "Importo"].map(label => <th scope="col" key={label}>{tr(label)}</th>)}</tr></thead><tbody>{Array.from({ length: count }, (_, index) => <tr className="entry-row" key={index}><td className="entry-actions"><Placeholder className="sk-entry-action" /><Placeholder className="sk-entry-action" /></td><td><Placeholder className="entry-icon" /></td><td className="entry-description"><Placeholder className="sk-text" /><Placeholder className="sk-caption" /></td><td className="entry-amount"><Placeholder className="sk-entry-amount" /></td></tr>)}</tbody></table></SkeletonStatus>;
}

export function SettingsPageSkeleton() {
  return <SkeletonStatus layout="expense-settings"><div className="subscription-settings-page"><div className="settings-layout"><aside className="settings-navigation" aria-hidden="true"><Placeholder className="sk-label" />{[0,1,2,3].map(index => <Placeholder className="sk-entry-navigation" key={index} />)}</aside><div className="settings-sections settings-redesign">{[0,1,2,3].map(index => <section className="settings-section" key={index}><div className="settings-section-heading"><Placeholder className="sk-settings-icon" /><div className="sk-grow"><Placeholder className="sk-section-title" /><Placeholder className="sk-caption" /></div></div>{index < 2 ? <div className="settings-profile-fields sk-settings-fields">{[0,1].map(field => <div className="sk-field" key={field}><Placeholder className="sk-label" /><Placeholder className="sk-field-line" /></div>)}</div> : <Placeholder className="sk-entry-page-size" />}</section>)}</div></div></div></SkeletonStatus>;
}

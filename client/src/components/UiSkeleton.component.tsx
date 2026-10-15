import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../styles/UiSkeleton.styles.css";

export function Placeholder({className="",style}:{className?:string;style?:CSSProperties}) { return <span aria-hidden="true" className={`ui-placeholder ${className}`} style={style} />; }
export function SkeletonStatus({children,layout}:{children:ReactNode;layout:string}) { const {t}=useTranslation();return <div role="status" aria-label={t("loader.loading")} aria-busy="true" data-skeleton-layout={layout}><div aria-hidden="true">{children}</div></div>; }
export function FieldSkeleton() { return <div className="sk-field"><Placeholder className="sk-label"/><div className="sk-field-line"><Placeholder className="sk-icon"/><Placeholder className="sk-text"/></div></div>; }
export function RowSkeleton({cover=false}:{cover?:boolean}) { return <div className="sk-row"><Placeholder className={cover ? "sk-cover" : "sk-icon"}/><div className="sk-grow"><Placeholder className="sk-text"/><Placeholder className="sk-caption"/></div><Placeholder className="sk-value"/></div>; }
export function MetricSkeleton() { return <div className="sk-metric"><Placeholder className="sk-icon"/><Placeholder className="sk-label"/><Placeholder className="sk-amount"/><Placeholder className="sk-caption"/></div>; }
export function ChartSkeleton({kind="line", fill=false, trend=false}:{kind?:"line"|"bars"|"donut";fill?:boolean;trend?:boolean}) { return <div aria-hidden="true" className={`sk-chart sk-chart--${kind} ${fill ? "sk-chart--fill" : ""} ${trend ? "sk-chart--trend" : ""}`}>
 {kind==="line" ? <svg viewBox="0 0 500 220" preserveAspectRatio="none"><path className="sk-chart-grid" d="M0 30H500M0 100H500M0 170H500"/><path className="sk-chart-line" d="M0 165L45 145L95 158L140 90L180 110L225 75L275 115L320 55L360 85L410 35L455 60L500 25"/></svg> : kind==="bars" ? [38,65,50,82,45,72,55,95,44,70,60,80].map((h,i)=><Placeholder key={i} className="sk-column" style={{height:h+"%"}}/>) : <><Placeholder className="sk-donut"/><div className="sk-legend"><Placeholder className="sk-text"/><Placeholder className="sk-text"/><Placeholder className="sk-text"/></div></>}
 </div>; }
export function EditorSkeleton({kind}:{kind:"routine"|"user"|"ppv"|"category"|"settings"}) {
 const sections=kind==="category"?1:kind==="routine"?3:kind==="settings"?2:4;
 return <SkeletonStatus layout={`editor-${kind}`}><div className="sk-editor">{Array.from({length:sections},(_,i)=><section className="sk-section" key={i}><Placeholder className="sk-section-title"/><Placeholder className="sk-caption"/>{kind==="ppv" && i===0 && <Placeholder className="sk-poster"/>}<div className="sk-fields">{Array.from({length:kind==="category"?1:2},(_,j)=><FieldSkeleton key={j}/>)}</div>{(kind==="routine"||kind==="user") && i>0 && <div className="sk-pills">{[0,1,2].map(n=><Placeholder key={n} className="sk-pill"/>)}</div>}</section>)}</div></SkeletonStatus>;
}
export function DetailSkeleton({kind}:{kind:"user"|"ppv"|"workout"}) {
 return <SkeletonStatus layout={`detail-${kind}`}><div className="sk-detail">
 <div className={`sk-detail-heading ${kind==="user" ? "sk-detail-heading--user" : ""}`}><Placeholder className="sk-avatar"/><div className="sk-grow"><Placeholder className="sk-title"/><Placeholder className="sk-caption"/></div><Placeholder className="sk-icon"/></div>
 {kind==="workout" ? <>{[0,1,2].map(i=><section key={i} className="sk-section"><RowSkeleton/><div className="sk-pills">{[0,1,2].map(j=><Placeholder key={j} className="sk-pill"/>)}</div></section>)}</> : <>
 {kind==="ppv" ? <div className="sk-ppv-hero"><Placeholder className="sk-poster"/><div className="sk-grow"><Placeholder className="sk-title"/><div className="sk-pills"><Placeholder className="sk-pill"/><Placeholder className="sk-pill"/></div><FieldSkeleton/></div></div> : <div className="sk-section"><div className="sk-pills"><Placeholder className="sk-pill"/></div><div className="sk-fields"><FieldSkeleton/><FieldSkeleton/></div></div>}
 <div className="sk-metrics">{[0,1,2].map(i=><MetricSkeleton key={i}/>)}</div>
 <section className="sk-section"><Placeholder className="sk-section-title"/>{kind==="user" ? <><RowSkeleton/><RowSkeleton/><RowSkeleton/></> : <><div className="sk-pills"><Placeholder className="sk-pill"/><Placeholder className="sk-pill"/></div><Placeholder className="sk-paragraph"/><Placeholder className="sk-text"/></>}</section>
 {kind==="user" && <div className="sk-chart-grid-layout"><section className="sk-section"><Placeholder className="sk-section-title"/><ChartSkeleton/></section><section className="sk-section"><Placeholder className="sk-section-title"/><ChartSkeleton kind="donut"/></section></div>}
 <section className="sk-section"><Placeholder className="sk-section-title"/><FieldSkeleton/><RowSkeleton/><RowSkeleton/><RowSkeleton/></section>
 </>}
 </div></SkeletonStatus>;
}
export function HomeCardsSkeleton() { return <SkeletonStatus layout="home-users"><div className="sk-home-cards">{Array.from({length:12},(_,i)=><div key={i} className="sk-home-card"><RowSkeleton/><div className="sk-pills"><Placeholder className="sk-pill"/></div><div className="sk-metrics">{[0,1,2].map(j=><div key={j}><Placeholder className="sk-label"/><Placeholder className="sk-value"/></div>)}</div></div>)}</div></SkeletonStatus>; }

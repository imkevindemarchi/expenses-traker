// Isolated responsive fixture. No authentication, database access or API writes.
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import "../src/i18n";
import "../src/index.css";
import "../src/styles/SharedTypography.styles.css";
import "../src/styles/StandaloneSettings.styles.css";
import { ThemeContext } from "../src/contexts/theme.context";
import PageSkeleton from "../src/components/PageSkeleton.component";
import EntriesTable from "../src/components/EntriesTable.component";
const routes=["options","pagination","overview","budget","annual","entries","categories","settings","loaded-entries"];
function Content({route}:{route:string}){return <main className={`app-main ui-refresh ${route==="settings"?"standalone-settings-page":""}`}>{route === "loaded-entries" ? <EntriesTable entries={[{_id:"1",kind:"expense",amountCents:1250,date:"2026-10-15",category:"demo"}]} categories={new Map([["demo",{_id:"demo",name:"Alimentari",color:"#32cd32"}]])} subcategories={new Map()} onEdit={()=>{}} onDelete={()=>{}}/> : route==="options"?<PageSkeleton layout="options"/>:route==="pagination"?<PageSkeleton layout="pagination"/>:route==="entries"?<><PageSkeleton layout="entries"/><PageSkeleton layout="pagination"/></>:route==="settings"?<PageSkeleton layout="settings"/>:route==="categories"?<PageSkeleton layout="categories"/>:<PageSkeleton layout={route==="annual"?"annual":"overview"} budget={route==="budget"}/>}</main>;}
function Preview(){const [route,setRoute]=useState(routes[0]); const [theme,setTheme]=useState<"light"|"dark">("light"); useEffect(() => { document.documentElement.dataset.theme=theme; }, [theme]);return <ThemeContext.Provider value={{theme,preference:theme,setPreference:()=>{}}}><div style={{position:"relative",zIndex:10001,padding:8,display:"flex",flexWrap:"wrap",gap:8}}><select style={{maxWidth:"100%"}} aria-label="Schermata" value={route} onChange={e=>setRoute(e.target.value)}>{routes.map(path=><option key={path}>{path}</option>)}</select><select aria-label="Tema" value={theme} onChange={e=>setTheme(e.target.value as "light"|"dark")}><option value="light">Chiaro</option><option value="dark">Scuro</option></select></div><MemoryRouter><Content route={route}/></MemoryRouter></ThemeContext.Provider>;}
createRoot(document.getElementById("root")!).render(<Preview/>);

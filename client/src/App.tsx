import {OverviewSkeleton,CategoriesSkeleton} from './components/LoadingSkeleton.component';
import EntryModal from './components/EntryModal.component';
import {CurrencyContext,useMoney} from './contexts/currency.context';
import FilteredBalance from './components/FilteredBalance.component';
import Autocomplete from './components/Autocomplete.component';
import FilterFloatingMenu from './components/FilterFloatingMenu.component';
import AnnualPage from './pages/Annual.page';
import SpendingBreakdown from './components/SpendingBreakdown.component';
import Pagination from './components/Pagination.component';
import EntriesTable from './components/EntriesTable.component';
import MonthPicker from './components/MonthPicker.component';
import { INCOME_COLOR, EXPENSE_COLOR } from './assets/constants/transaction-colors';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { ROUTE_PATHS, pageFromPath, safeReturnPath } from './routes/routes.config';
import { usePageTitle } from './hooks/use-page-title.hook';
import SettingsPage from './pages/Settings.page';
import MonthlyBudget from './components/MonthlyBudget.component';
import LanguageSelector from './components/LanguageSelector.component';
import { useTranslation } from 'react-i18next';
import { tr, locale } from './i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, Plus, Pencil, Trash2, Download, ListFilter, RotateCcw, ChevronLeft, ChevronRight, ArrowRight, Eye, EyeOff, Mail, LockKeyhole, UserRound, CircleCheck, AlertCircle, Shapes, Euro, X, TrendingUp } from 'lucide-react';
import { ThemeContext, type ThemePreference } from './contexts/theme.context';
import { api, ApiError, money as formatMoney, today, displayDate, csvCell } from './api';
import type { User, Category, Subcategory, Entry, Summary } from './types';
import Navbar, { type Page } from './components/Navbar.component';
import Glass from './components/Glass.component';
import Button from './components/Button.component';
import FloatingButton from './components/FloatingButton.component';
import Modal from './components/Modal.component';
import Input from './components/Input.component';
import InputNumber from './components/InputNumber.component';

import Header from './components/Header.component';
import Accordion from './components/Accordion.component';
import Popup from './components/Popup.component';
import BigButton from './components/BigButton.component';
import Shadowbox from './components/Shadowbox.component';

const emptySummary: Summary = { income: 0, expense: 0, balance: 0, count: 0, byCategory: [], daily: [] };
const errorText = (error: unknown) => error instanceof Error ? error.message : tr("Si è verificato un errore.");
type EntryForm = { kind: 'expense' | 'income'; amount: string; date: string; category: string; subcategory: string };
type ManageForm = { mode: 'category' | 'subcategory'; id?: string; name: string; color: string; category: string };
type DeleteAction = { endpoint: string; label: string };

export default function App() {
  useTranslation();
  const [themePreference,setThemePreference]=useState<ThemePreference>(()=>{const saved=localStorage.getItem('expenses-theme');return saved==='light'||saved==='dark'?saved:'system';});
  const [systemTheme,setSystemTheme]=useState<'light'|'dark'>(()=>window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const theme=themePreference==='system'?systemTheme:themePreference;
  useEffect(()=>{localStorage.setItem('expenses-theme',themePreference);},[themePreference]);
  const [user, setUser] = useState<User | null>(null);
  const money=(cents:number)=>formatMoney(cents,user?.currency??'EUR');
  const [boot, setBoot] = useState(true);
  const location = useLocation(); const navigate = useNavigate();
  const page = pageFromPath(location.pathname);
  usePageTitle(location.pathname === ROUTE_PATHS.login ? tr('Accedi') : location.pathname === ROUTE_PATHS.register ? tr('Registrati') : tr(page === 'dashboard' ? 'Riepilogo mensile' : page === 'entries' ? 'Movimenti' : page === 'settings' ? 'Impostazioni' : page === 'annual' ? 'Riepilogo annuale' : 'Management'));
  const [month, setMonth] = useState(today().slice(0, 7));
  const [categoriesLoading,setCategoriesLoading]=useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterKind, setFilterKind] = useState('');
  const [kindMenuOpen,setKindMenuOpen]=useState(false);
  const [search, setSearch] = useState('');
  const filtersChanged=Boolean(search || filterCategory || filterKind || month!==today().slice(0,7));
  const resetEntryFilters=()=>{setKindMenuOpen(false);setSearch('');setFilterCategory('');setFilterKind('');setMonth(today().slice(0,7));setListPage(1);};
  const [listPage, setListPage] = useState(1);
  const [pageLimit,setPageLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; message: string } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [entryEdit, setEntryEdit] = useState<{ id?: string; form: EntryForm } | null>(null);
  const [manageEdit, setManageEdit] = useState<ManageForm | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction | null>(null);
  const [exportConfirm,setExportConfirm]=useState(false);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { const query = window.matchMedia('(prefers-color-scheme: dark)'); const change = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light'); query.addEventListener('change', change); return () => query.removeEventListener('change', change); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  useEffect(() => {
    let active = true;
    api<{ user: User }>('/auth/me').then(data => { if (active) setUser(data.user); }).catch(error => { if (active && (!(error instanceof ApiError) || error.status !== 401)) setNotice({ error: true, message: errorText(error) }); }).finally(() => { if (active) setBoot(false); });
    const expired = () => { setUser(null);setCategories([]);setSubcategories([]);setEntries([]);setSummary(emptySummary); setEntryEdit(null); setManageEdit(null); setDeleteAction(null); setNotice({ error: true, message: 'Sessione scaduta. Accedi di nuovo.' }); };
    window.addEventListener('session-expired', expired);
    return () => { active = false; window.removeEventListener('session-expired', expired); };
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setCategoriesLoading(true);
    api<{ categories: Category[]; subcategories: Subcategory[] }>('/categories').then(data => { if (active) { setCategories(data.categories); setSubcategories(data.subcategories); } }).catch(error => { if (active) setNotice({ error: true, message: errorText(error) }); }).finally(()=>{if(active)setCategoriesLoading(false);});
    return () => { active = false; };
  }, [user, refresh]);
  useEffect(() => {
    if (!user) return;
    let active = true; setLoading(true);
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ month, page: String(listPage), limit:String(pageLimit) });
      if (filterCategory) query.set('category', filterCategory);
      if (filterKind) query.set('kind', filterKind);
      if (search.trim()) query.set('q', search.trim());
      Promise.all([api<{ entries: Entry[]; total: number; totalPages: number }>(`/entries?${query}`), api<Summary>(`/summary?${page === 'entries' ? query : new URLSearchParams({month})}`)])
        .then(([list, totals]) => { if (active) { if (listPage > Math.max(1,list.totalPages)) {setListPage(Math.max(1,list.totalPages));return;} setEntries(list.entries); setTotalEntries(list.total); setTotalPages(list.totalPages); setSummary(totals); } })
        .catch(error => { if (active) setNotice({ error: true, message: errorText(error) }); })
        .finally(() => { if (active) setLoading(false); });
    }, search ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [user, month, listPage, pageLimit, filterCategory, filterKind, search, refresh, page]);
  const categoryById = new Map(categories.map(item => [item._id, item]));
  const subcategoryById = new Map(subcategories.map(item => [item._id, item]));
  const mutate = async (endpoint: string, method: string, body?: unknown) => {
    setBusy(true); setNotice(null);
    try { await api(endpoint, { method, body }); setRefresh(value => value + 1); setNotice({ error: false, message: 'Modifica salvata.' }); return true; }
    catch (error) { setNotice({ error: true, message: errorText(error) }); return false; }
    finally { setBusy(false); }
  };
  const openEntry = (entry?: Entry) => setEntryEdit(entry ? { id: entry._id, form: { kind: entry.kind, amount: (entry.amountCents / 100).toFixed(2), date: entry.date, category: entry.category, subcategory: entry.subcategory ?? '' } } : { form: { kind: 'expense', amount: '', date: today(), category: '', subcategory: '' } });
  const saveManage = async (event: FormEvent) => { event.preventDefault(); if (!manageEdit) return; const route = manageEdit.mode === 'category' ? 'categories' : 'subcategories'; if (await mutate(`/${route}${manageEdit.id ? `/${manageEdit.id}` : ''}`, manageEdit.id ? 'PATCH' : 'POST', manageEdit)) setManageEdit(null); };
  useEffect(() => {setSearch('');setFilterCategory('');setFilterKind('');setListPage(1);setEntryEdit(null);setManageEdit(null);setDeleteAction(null);setKindMenuOpen(false);window.scrollTo({top:0,behavior:'instant'});}, [location.pathname]);
  const changePage = (next: Page) => { navigate(ROUTE_PATHS[next]); setSearch(''); setFilterCategory(''); setFilterKind(''); setListPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const logout = async () => { if (await mutate('/auth/logout', 'POST')) { setUser(null); setCategories([]); setSubcategories([]); setEntries([]); setSummary(emptySummary); navigate(ROUTE_PATHS.login, {replace:true}); setNotice(null); } };
  const exportCsv = async () => {
    if(busy)return;
    setBusy(true);
    try {
      const all: Entry[] = [];
      const query = new URLSearchParams({ month });
      if (filterCategory) query.set('category', filterCategory);
      if (filterKind) query.set('kind', filterKind);
      if (search.trim()) query.set('q', search.trim());
      for (let cursor = 1; ; cursor++) {
        query.set('page', String(cursor));
        const result = await api<{ entries: Entry[]; totalPages: number }>(`/entries?${query}`);
        all.push(...result.entries); if (cursor >= result.totalPages) break;
      }
      const rows = [[tr('Data'), tr('Tipo'), tr('Importo {{currency}}',{currency:user?.currency??'EUR'}), tr('Categoria'), tr('Sottocategoria')], ...all.map(item => [item.date, item.kind === 'expense' ? tr('Spesa') : tr('Entrata'), new Intl.NumberFormat(locale(), {minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false}).format(item.amountCents/100), categoryById.get(item.category)?.name ?? '', subcategoryById.get(item.subcategory ?? '')?.name ?? ''])];
      const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
      const reportMonth = new Intl.DateTimeFormat(locale(), {month:'long',year:'numeric'}).format(new Date(`${month}-01T12:00:00`));
      const reportName = reportMonth.charAt(0).toLocaleUpperCase(locale()) + reportMonth.slice(1);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = tr('Report movimenti {{month}}', {month:reportName}) + '.csv'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportConfirm(false);
    } catch (error) { setNotice({ error: true, message: errorText(error) }); } finally { setBusy(false); }
  };
  return <CurrencyContext.Provider value={user?.currency??'EUR'}><ThemeContext.Provider value={{theme,preference:themePreference,setPreference:setThemePreference}}>
    {notice && <Popup key={notice.message} popup={{ type: notice.error ? 'error' : 'success', message: tr(notice.message) }} isClosing={false} onClose={() => setNotice(null)} />}
    {boot ? null : !user ? <Routes><Route path="/login" element={<Auth onLogin={account => {setUser(account);setNotice(null);navigate(safeReturnPath(location.state?.from),{replace:true});}} />} /><Route path="/register" element={<Auth onLogin={account => {setUser(account);setNotice(null);navigate(safeReturnPath(location.state?.from),{replace:true});}} />} /><Route path="*" element={<Navigate to="/login" state={{from:location.pathname}} replace />} /></Routes> : (location.pathname === ROUTE_PATHS.login || location.pathname === ROUTE_PATHS.register) ? <Navigate to={safeReturnPath(location.state?.from)} replace /> : <>
      <Navbar user={user} onLogout={() => { void logout(); }} />
      <main className="app-main">
        <div className="page-top"><div><Header title={page === 'dashboard' ? tr("Riepilogo mensile") : page === 'entries' ? tr("I tuoi movimenti") : page === 'settings' ? tr("Impostazioni") : page === 'annual' ? tr('Riepilogo annuale') : tr("Management")} /></div>{(page === 'dashboard' || page === 'entries') && <div className={`month-filter${page === 'dashboard' ? ' month-filter-left' : ''}`}><MonthPicker value={month} onChange={value=>{setMonth(value);setListPage(1);}}/></div>}</div>
        <Routes><Route path={ROUTE_PATHS.dashboard} element={<>
          {loading||categoriesLoading ? <OverviewSkeleton budget={user.monthlyBudgetCents!=null&&month===today().slice(0,7)}/> : <>          <div className="overview-grid"><Glass className="balance-card"><div className="balance-heading"><span className="eyebrow">{tr("BILANCIO DEL MESE")}</span><span className="round-icon"><Wallet size={20} /></span></div><p className="balance-value">{money(summary.balance)}</p><p className="muted">{tr("Entrate meno spese del periodo selezionato.")}</p><span className="balance-chip"><TrendingUp size={14} /> {tr("{{count}} movimenti registrati", {count:summary.count})}</span></Glass><Glass className="stat-card income-card"><span className="stat-icon income"><ArrowDownLeft size={24} /></span><p className="muted">{tr("Entrate")}</p><strong>{money(summary.income)}</strong><small>{tr("Quello che hai guadagnato")}</small></Glass><Glass className="stat-card expense-card"><span className="stat-icon expense"><ArrowUpRight size={24} /></span><p className="muted">{tr("Spese")}</p><strong>{money(summary.expense)}</strong><small>{tr("Quello che hai speso")}</small></Glass></div>
          {month === today().slice(0,7) && user.monthlyBudgetCents != null && !loading && <MonthlyBudget limit={user.monthlyBudgetCents} spent={summary.expense} />}
          <div className="charts-grid"><Glass className="panel"><div className="section-heading"><div><p className="eyebrow">{tr("COME SI MUOVE IL TUO DENARO")}</p><h2>{tr("Andamento del mese")}</h2></div><span className="legend"><i />  {tr("Spese")} <i className="income-dot" />  {tr("Entrate")}</span></div><Trend summary={summary} month={month} /></Glass><Glass className="panel"><p className="eyebrow">{tr("DOVE VA IL TUO DENARO")}</p><h2>{tr("Spese per categoria")}</h2><SpendingBreakdown summary={summary} categories={categoryById} /></Glass></div>
</>}
          <Glass className="panel"><div className="section-heading"><h2>{tr("Ultimi movimenti")}</h2><Button variant="secondary" onClick={() => changePage('entries')}>{tr("Vedi tutti")} <ArrowUpRight size={16} /></Button></div>{loading||categoriesLoading ? <Skeleton /> : <EntriesTable entries={entries.slice(0, 5)} categories={categoryById} subcategories={subcategoryById} onEdit={openEntry} onDelete={item => setDeleteAction({ endpoint: `/entries/${item._id}`, label: (item.subcategory ? subcategoryById.get(item.subcategory)?.name : categoryById.get(item.category)?.name) ?? tr('Categoria') })} />}</Glass>
        </>} />
        <Route path={ROUTE_PATHS.entries} element={<Glass className="panel"><div className="section-heading"><div><h2>{tr("Il tuo registro")}</h2><p className="muted">{tr("{{count}} movimenti · {{month}}", {count:totalEntries, month})}</p></div></div><div className="filters"><Input id="search" placeholder={tr("Cerca un movimento…")} value={search} onChange={event => { setSearch(event.target.value); setListPage(1); }} /><Autocomplete id="filter-category" isLoading={categoriesLoading} placeholder={tr("Tutte le categorie")} value={categoryById.get(filterCategory)??null} options={categories} getOptionKey={item=>item._id} getOptionLabel={item=>item.name} getOptionIcon={item=><span className="category-filter-dot" style={{background:item.color}}/>} onChange={item=>{setFilterCategory(item?._id??'');setListPage(1);}} /></div><FilteredBalance summary={summary} kind={filterKind} loading={loading}/>{loading ? <Skeleton /> : <EntriesTable entries={entries} categories={categoryById} subcategories={subcategoryById} onEdit={openEntry} onDelete={item => setDeleteAction({ endpoint: `/entries/${item._id}`, label: (item.subcategory ? subcategoryById.get(item.subcategory)?.name : categoryById.get(item.category)?.name) ?? tr('Categoria') })} />}{!loading && <Pagination pagination={{page:listPage,limit:pageLimit,total_items:totalEntries,total_pages:Math.max(1,totalPages),has_next_page:listPage<totalPages,has_previous_page:listPage>1}} limitOptions={[10,20,50]} selectId="entries-pagination" flush compactDesktop onPageChange={setListPage} onLimitChange={limit=>{setPageLimit(limit);setListPage(1);}}/>}</Glass>} />
        <Route path={ROUTE_PATHS.management} element={<><Glass className="management-intro"><Shapes size={24} /><div><h2>{tr("Le tue categorie, il tuo ordine.")}</h2><p>{tr("Ogni sottocategoria appartiene a una categoria principale. Tutto quello che crei è visibile solo nel tuo account.")}</p></div></Glass>{categoriesLoading ? <CategoriesSkeleton/> : <div className="category-grid">{categories.map(category => <Shadowbox key={category._id} className="category-card"><div className="category-header"><span className="category-orb" style={{ background: category.color + '20', color: category.color }}><Shapes size={22} /></span><h2>{category.name}</h2><button className="quiet-icon" aria-label={tr("Modifica {{name}}", {name:category.name})} onClick={() => setManageEdit({ mode: 'category', id: category._id, name: category.name, color: category.color, category: '' })}><Pencil size={16} /></button><button className="quiet-icon danger" aria-label={tr("Elimina {{name}}", {name:category.name})} onClick={() => setDeleteAction({ endpoint: `/categories/${category._id}`, label: category.name })}><Trash2 size={16} /></button></div><Accordion defaultOpen ariaLabel={tr("Sottocategorie di {{name}}", {name:category.name})} header={<span className="muted">{tr("Sottocategorie")} <span className="count">{subcategories.filter(item => item.category === category._id).length}</span></span>} contentClassName="subcategory-list">{subcategories.filter(item => item.category === category._id).map(item => <div className="subcategory" key={item._id}><span><i style={{ background: category.color }} />{item.name}</span><button className="quiet-icon" aria-label={tr("Modifica {{name}}", {name:item.name})} onClick={() => setManageEdit({ mode: 'subcategory', id: item._id, name: item.name, color: category.color, category: category._id })}><Pencil size={15} /></button><button className="quiet-icon danger" aria-label={tr("Elimina {{name}}", {name:item.name})} onClick={() => setDeleteAction({ endpoint: `/subcategories/${item._id}`, label: item.name })}><Trash2 size={15} /></button></div>)}<Button variant="secondary" className="w-full mt-3" onClick={() => setManageEdit({ mode: 'subcategory', name: '', color: category.color, category: category._id })}><Plus size={16} />  {tr("Sottocategoria")}</Button></Accordion></Shadowbox>)}</div>}{!categoriesLoading && !categories.length && <Empty text={tr("Crea la tua prima categoria per iniziare.")} />}</>} />
<Route path="/annual" element={<AnnualPage refresh={refresh} categories={categoryById} subcategories={subcategoryById} onEdit={openEntry} onDelete={item=>setDeleteAction({endpoint:`/entries/${item._id}`,label:(item.subcategory?subcategoryById.get(item.subcategory)?.name:categoryById.get(item.category)?.name)??tr('Categoria')})}/>} /><Route path="/settings" element={<SettingsPage onDeleted={()=>{setUser(null);setCategories([]);setSubcategories([]);setEntries([]);setSummary(emptySummary);setEntryEdit(null);setManageEdit(null);setDeleteAction(null);setExportConfirm(false);navigate(ROUTE_PATHS.login,{replace:true});setNotice({error:false,message:'Account eliminato.'});}} user={user} onSaved={setUser} onNotice={(error,message)=>setNotice({error,message})} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>
        <footer className="app-footer"><img src="/expenses-logo.png?v=2" width={14} height={14} alt="" aria-hidden="true" /> expenses-traker <span>{tr("Uno spazio personale. Una visione chiara.")}</span></footer>
      </main>
      {page !== 'settings' && <div className="floating-actions flex items-center gap-3">
        {page==='entries' && <>
          <FloatingButton ariaLabel={tr('Esporta CSV')} title={tr('Esporta CSV')} icon={<Download size={27}/>} disabled={busy||loading} onClick={()=>setExportConfirm(true)}/>
          <FilterFloatingMenu ariaLabel={tr('Tipo di movimento')} icon={<ListFilter size={27}/>} value={filterKind} options={[{value:'',label:tr('Tutti'),icon:<Wallet size={18}/>},{value:'income',label:tr('Entrate'),icon:<ArrowDownLeft size={18} className="income-text"/>},{value:'expense',label:tr('Spese'),icon:<ArrowUpRight size={18} className="expense-text"/>}]} isOpen={kindMenuOpen} onClose={()=>setKindMenuOpen(false)} onToggle={()=>setKindMenuOpen(value=>!value)} onChange={value=>{setFilterKind(value);setListPage(1);setKindMenuOpen(false);}}/>
          {filtersChanged && <FloatingButton ariaLabel={tr('Azzera filtri')} title={tr('Azzera filtri')} icon={<RotateCcw size={28}/>} onClick={resetEntryFilters}/>}
        </>}
        <FloatingButton ariaLabel={page === 'management' ? tr("Crea categoria") : tr("Registra movimento")} icon={<Plus size={28}/>} onClick={()=>page === 'management' ? setManageEdit({mode:'category',name:'',color:'#32cd32',category:''}) : openEntry()}/>
      </div>}
      {exportConfirm && <Modal isOpen title={tr('Esporta CSV')} maxWidth="sm" isClosable={!busy} onClose={()=>setExportConfirm(false)} footer={<><Button variant="secondary" disabled={busy} onClick={()=>setExportConfirm(false)}>{tr('Annulla')}</Button><Button disabled={busy||loading} icon={<Download size={17}/>} onClick={()=>{void exportCsv();}}>{tr(busy?'Un momento…':'Esporta CSV')}</Button></>}><p>{tr('Vuoi scaricare il report CSV dei movimenti selezionati?')}</p><p className="muted">{tr('{{count}} movimenti · {{month}}',{count:totalEntries,month})}</p></Modal>}
      {entryEdit && <EntryModal initial={entryEdit.form} editing={Boolean(entryEdit.id)} categories={categories} subcategories={subcategories} busy={busy} onClose={()=>setEntryEdit(null)} onSave={async form=>{if(await mutate(`/entries${entryEdit.id?`/${entryEdit.id}`:''}`,entryEdit.id?'PATCH':'POST',form)){setEntryEdit(null);setListPage(1);}}}/>}
      <Modal isOpen={Boolean(manageEdit)} title={tr(manageEdit?.mode === 'category' ? (manageEdit.id ? 'Modifica categoria' : 'Nuova categoria') : (manageEdit?.id ? 'Modifica sottocategoria' : 'Nuova sottocategoria'))} isClosable={!busy} onClose={() => setManageEdit(null)} footer={<><Button variant="secondary" disabled={busy} onClick={() => setManageEdit(null)}>{tr("Annulla")}</Button><Button type="submit" form="manage-form" disabled={busy||(manageEdit?.mode==='subcategory'&&!categoryById.has(manageEdit.category))}>{busy ? tr("Salvataggio…") : tr("Salva")}</Button></>}>
        {manageEdit && <form id="manage-form" onSubmit={saveManage} className="form-stack"><Input id="manage-name" autoFocus={!manageEdit.id} label={tr("Nome")} required maxLength={60} value={manageEdit.name} onChange={event => setManageEdit({ ...manageEdit, name: event.target.value })} />{manageEdit.mode === 'category' ? <label className="color-picker">{tr("Colore della categoria")}<input type="color" value={manageEdit.color} onChange={event => setManageEdit({ ...manageEdit, color: event.target.value })} /></label> : <><Autocomplete id="manage-parent" label={tr("Categoria principale obbligatoria")} placeholder={tr("Seleziona")} searchPlaceholder={tr("Cerca categoria…")} value={categoryById.get(manageEdit.category)??null} options={categories} isLoading={categoriesLoading} disabled={busy} clearable={false} getOptionKey={item=>item._id} getOptionLabel={item=>item.name} getOptionIcon={item=><span className="category-filter-dot" style={{background:item.color}}/>} onChange={item=>setManageEdit({...manageEdit,category:item?._id??''})} /><p className="muted">{tr("Una sottocategoria già usata nei movimenti può essere rinominata, ma va riassegnata prima di cambiare categoria principale.")}</p></>}</form>}
      </Modal>
      <Modal isOpen={Boolean(deleteAction)} title={tr("Conferma eliminazione")} description={tr("Vuoi eliminare “{{name}}”?", {name:deleteAction?.label ?? ""})} maxWidth="sm" isClosable={!busy} onClose={() => setDeleteAction(null)} footer={<><Button variant="secondary" disabled={busy} onClick={() => setDeleteAction(null)}>{tr("Annulla")}</Button><Button variant="danger" disabled={busy} onClick={async () => { if (deleteAction && await mutate(deleteAction.endpoint, 'DELETE')) { setDeleteAction(null); setListPage(1); } }}>{busy ? tr("Eliminazione…") : tr("Elimina")}</Button></>}><p className="muted">{tr("Le categorie collegate a sottocategorie o movimenti non vengono eliminate: riassegna prima i dati collegati.")}</p></Modal>
    </>}
  </ThemeContext.Provider></CurrencyContext.Provider>;
}

function Auth({ onLogin }: { onLogin: (user: User) => void }) {
  const location = useLocation(); const navigate = useNavigate(); const register = location.pathname === ROUTE_PATHS.register; const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'email' | 'password', string>>>({});
  const changeField = (field: 'name' | 'email' | 'password', value: string) => { setForm(previous => ({ ...previous, [field]: value })); setFieldErrors(previous => ({ ...previous, [field]: undefined })); setError(''); };
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [showPassword, setShowPassword] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (busy) return;
    const errors: Partial<Record<'name' | 'email' | 'password', string>> = {};
    if (register && !form.name.trim()) errors.name = 'Inserisci il tuo nome.';
    else if (register && form.name.trim().length > 60) errors.name = 'Il nome può contenere al massimo 60 caratteri.';
    if (!form.email.trim()) errors.email = 'Inserisci la tua email.';
    else if (form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Inserisci un indirizzo email valido.';
    if (!form.password) errors.password = 'Inserisci la password.';
    else if (form.password.length < 10) errors.password = 'La password deve avere almeno 10 caratteri.';
    else if (new TextEncoder().encode(form.password).length > 72) errors.password = 'La password è troppo lunga (massimo 72 byte).';
    setFieldErrors(errors); setError('');
    if (Object.keys(errors).length) { document.getElementById('auth-' + Object.keys(errors)[0])?.focus(); return; }
    setBusy(true); try { const result = await api<{ user: User }>(register ? '/auth/register' : '/auth/login', { method: 'POST', body: form }); onLogin(result.user); } catch (error) { setError(errorText(error)); } finally { setBusy(false); } };
  return <main className="auth-page"><div className="auth-language"><LanguageSelector /></div><Shadowbox className="auth-card"><div className="auth-card-content"><div className="auth-logo"><img src="/expenses-logo.png?v=2" width={48} height={48} alt="" aria-hidden="true" /><span>Expenses <strong>Traker</strong></span></div><h1>{register ? tr("Crea il tuo account") : tr("Accedi al tuo account")}</h1><form onSubmit={submit} className="form-stack" noValidate aria-busy={busy}>{register && <Input id="auth-name" label={tr("Il tuo nome")} placeholder={tr("Inserisci il tuo nome")} error={fieldErrors.name ? tr(fieldErrors.name!) : undefined} icon={<UserRound size={17} />} autoComplete="name" required disabled={busy} maxLength={60} value={form.name} onChange={event => changeField('name', event.target.value)} />}<Input id="auth-email" label={tr("Email")} error={fieldErrors.email ? tr(fieldErrors.email!) : undefined} placeholder={tr("Inserisci la tua email")} icon={<Mail size={17} />} autoComplete="email" type="email" required disabled={busy} value={form.email} onChange={event => changeField('email', event.target.value)} /><Input id="auth-password" label={tr("Password")} error={fieldErrors.password ? tr(fieldErrors.password!) : undefined} placeholder={tr("Inserisci la tua password")} icon={<LockKeyhole size={17} />} autoComplete={register ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} endIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />} endIconAriaLabel={showPassword ? tr("Nascondi password") : tr("Mostra password")} onEndIconClick={() => setShowPassword(value => !value)} minLength={register ? 10 : undefined} required disabled={busy} value={form.password} onChange={event => changeField('password', event.target.value)} />{register && <small className="muted">{tr("Almeno 10 caratteri. Le tue categorie iniziali saranno Lavoro, Extra e Necessità.")}</small>}{error && <p role="alert" className="form-error">{tr(error)}</p>}<BigButton type="submit" disabled={busy} className="auth-submit" endIcon={<ArrowRight size={18} />}>{busy ? tr("Un momento…") : register ? tr("Crea account") : tr("Accedi")}</BigButton></form><p className="auth-switch">{register ? tr("Hai già un account?") : tr("È la tua prima volta?")} <button disabled={busy} onClick={() => { navigate(register ? ROUTE_PATHS.login : ROUTE_PATHS.register, {state:location.state}); setError(''); setFieldErrors({}); }}>{register ? tr("Accedi") : tr("Registrati")}</button></p></div></Shadowbox></main>;
}
function Empty({ text }: { text: string }) { return <div className="empty"><span><Wallet size={28} /></span><h3>{tr("Un nuovo inizio.")}</h3><p>{text}</p></div>; }
function Skeleton() { return <div role="status" aria-label={tr("Caricamento movimenti")} className="skeleton-list">{[1, 2, 3].map(value => <div key={value} className="animate-pulse" />)}</div>; }
function Trend({ summary, month }: { summary: Summary; month: string }) {
 const money=useMoney();
  const [year, number] = month.split('-').map(Number); const days = new Date(year, number, 0).getDate();
  const values = Array.from({ length: days }, (_, index) => ({ day: index + 1, expense: 0, income: 0 }));
  for (const item of summary.daily) { const day = Number(item._id.date.slice(-2)); if (values[day - 1]) values[day - 1][item._id.kind] += item.total; }
  const max = Math.max(100, ...values.flatMap(item => [item.expense, item.income]));
  const points = (kind: 'expense' | 'income') => values.map((value, index) => `${18 + index * 544 / (days - 1)},${160 - value[kind] / max * 130}`).join(' ');
  return <div className="trend"><svg viewBox="0 0 580 190" role="img" aria-label={tr("Andamento giornaliero di entrate e spese")}><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity=".18" /><stop offset="100%" stopColor="#32cd32" stopOpacity="0" /></linearGradient></defs>{[30, 95, 160].map(y => <line key={y} x1="18" x2="562" y1={y} y2={y} stroke="currentColor" opacity=".08" />)}<polygon points={`18,160 ${points('expense')} 562,160`} fill="url(#chart-fill)" /><polyline points={points('expense')} fill="none" stroke={EXPENSE_COLOR} strokeWidth="3" strokeLinejoin="round" /><polyline points={points('income')} fill="none" stroke={INCOME_COLOR} strokeWidth="2" strokeDasharray="5 4" />{[1, Math.round(days / 2), days].map(day => <text key={day} x={18 + (day - 1) * 544 / (days - 1)} y="185" textAnchor="middle" fill="currentColor" opacity=".5" fontSize="11">{day}</text>)}</svg><small className="muted">{tr("Scala massima giornaliera:")} {money(max)}</small></div>;
}

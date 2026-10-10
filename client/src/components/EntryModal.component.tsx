import {useTranslation} from 'react-i18next';
import DatePicker from './DatePicker.component';
import {useContext,useState,type FormEvent} from 'react';
import {ArrowDownLeft,ArrowUpRight,Search,Check,ChevronLeft,ChevronRight} from 'lucide-react';
import {tr,locale} from '../i18n';
import {CurrencyContext} from '../contexts/currency.context';
import type {Category,Subcategory} from '../types';
import Modal from './Modal.component';
import Stepper from './Stepper.component';
import Button from './Button.component';
import Input from './Input.component';
import InputNumber from './InputNumber.component';
type EntryForm={kind:'income'|'expense';category:string;subcategory:string;amount:string;date:string};
export default function EntryModal({initial,editing,categories,subcategories,busy,onClose,onSave}:{initial:EntryForm;editing:boolean;categories:Category[];subcategories:Subcategory[];busy:boolean;onClose:()=>void;onSave:(form:EntryForm)=>Promise<void>}){
 useTranslation();
 const currency=useContext(CurrencyContext);
 const [form,setForm]=useState(initial);
 const [step,setStep]=useState(0);
 const [chosenKind,setChosenKind]=useState(editing);
 const [search,setSearch]=useState('');
 const [categorySearch,setCategorySearch]=useState('');
 const [subcategorySearch,setSubcategorySearch]=useState('');
 const [error,setError]=useState('');
 const update=(patch:Partial<EntryForm>)=>{setForm(value=>({...value,...patch}));setError('');};
 const move=(next:number)=>{setStep(next);setSearch('');setError('');};
 const next=()=>{if(step===0&&!chosenKind)return;if(step===1&&!form.category)return;if(step===2&&!form.subcategory)return;move(step+1);};
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(busy)return;if(!editing&&step<3){next();return;}
  const amount=Number(form.amount.replace(',','.'));
  if(!/^\d{1,7}([.,]\d{1,2})?$/.test(form.amount)||!Number.isFinite(amount)||amount<=0||amount>1000000){setError('Inserisci un importo tra 0,01 e 1.000.000, con massimo due decimali.');return;}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(form.date)||!Number.isFinite(Date.parse(form.date+'T12:00:00Z'))||new Date(form.date+'T12:00:00Z').toISOString().slice(0,10)!==form.date){setError('Data non valida.');return;}
  if(!categories.some(item=>item._id===form.category)||!form.subcategory||!subcategories.some(item=>item._id===form.subcategory&&item.category===form.category)){if(!editing)move(1);setError('Seleziona una categoria valida.');return;}
  await onSave(form);
 };
 const selectedCategory=categories.find(item=>item._id===form.category);
 const filteredCategories=categories.filter(item=>item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const filteredSubcategories=subcategories.filter(item=>item.category===form.category&&item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const editCategories=categories.filter(item=>item.name.toLocaleLowerCase().includes(categorySearch.trim().toLocaleLowerCase()));
 const editSubcategories=subcategories.filter(item=>item.category===form.category&&item.name.toLocaleLowerCase().includes(subcategorySearch.trim().toLocaleLowerCase()));
 if(editing)return <Modal isOpen title={tr('Modifica movimento')} maxWidth="md" isClosable={!busy} onClose={onClose} footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>{tr('Annulla')}</Button><Button type="submit" form="entry-edit" disabled={busy||!form.category||!form.subcategory||!categories.length} icon={<Check size={17}/>}>{tr(busy?'Salvataggio…':'Salva movimento')}</Button></>}>
 <form id="entry-edit" onSubmit={submit} noValidate aria-busy={busy} className="entry-edit-form">
 <fieldset disabled={busy} className="entry-edit-fields"><legend className="sr-only">{tr('Modifica movimento')}</legend>
 <div className="entry-edit-kind" role="group" aria-label={tr('Tipo')}>{(['expense','income'] as const).map(kind=><button type="button" key={kind} className={`entry-kind-option ${kind}`} aria-label={tr(kind==='expense'?'Spesa':'Entrata')} title={tr(kind==='expense'?'Spesa':'Entrata')} aria-pressed={form.kind===kind} onClick={()=>update({kind})}><span className="entry-kind-icon">{kind==='expense'?<ArrowUpRight size={19}/>:<ArrowDownLeft size={19}/>}</span><span className="entry-kind-label">{tr(kind==='expense'?'Spesa':'Entrata')}</span></button>)}</div>
 <div className="entry-edit-choices"><Input id="entry-edit-category-search" label={tr('Categoria')} placeholder={tr('Cerca categoria…')} icon={<Search size={16}/>} value={categorySearch} onChange={event=>setCategorySearch(event.target.value)}/><div className="entry-pills" role="group" aria-label={tr('Categoria')}>{editCategories.map(item=><button type="button" key={item._id} className="entry-pill" aria-pressed={form.category===item._id} onClick={()=>{update({category:item._id,subcategory:item._id===form.category?form.subcategory:''});if(item._id!==form.category)setSubcategorySearch('');}}><i style={{background:item.color}}/>{item.name}{form.category===item._id&&<Check size={14}/>}</button>)}</div>{!editCategories.length&&<p className="muted">{tr('Nessun risultato.')}</p>}</div>
 <div className="entry-edit-choices"><Input id="entry-edit-subcategory-search" label={tr('Sottocategoria')} placeholder={tr('Cerca sottocategoria…')} icon={<Search size={16}/>} disabled={!form.category} value={subcategorySearch} onChange={event=>setSubcategorySearch(event.target.value)}/><div className="entry-pills" role="group" aria-label={tr('Sottocategoria')}>{editSubcategories.map(item=><button type="button" key={item._id} className="entry-pill" aria-pressed={form.subcategory===item._id} onClick={()=>update({subcategory:item._id})}><i style={{background:selectedCategory?.color}}/>{item.name}{form.subcategory===item._id&&<Check size={14}/>}</button>)}</div>{!editSubcategories.length&&<p className="muted">{tr('Nessun risultato.')}</p>}</div>
 <div className="entry-edit-details"><InputNumber id="entry-edit-amount" label={tr('Importo {{currency}}',{currency})} value={form.amount} allowDecimal inputMode="decimal" placeholder={new Intl.NumberFormat(locale(), {minimumFractionDigits:2}).format(0)} onChange={amount=>update({amount})}/><DatePicker id="entry-edit-date" label={tr('Data')} value={form.date?new Date(form.date+'T12:00:00'):null} disabled={busy} onChange={date=>update({date:date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`:''})}/></div>
 </fieldset>{error&&<p className="form-error" role="alert">{tr(error)}</p>}
 </form></Modal>;
 return <Modal isOpen title={editing?tr('Modifica movimento'):tr('Nuovo movimento')} maxWidth="lg" isClosable={!busy} onClose={onClose} footer={<><Button variant="secondary" disabled={busy} onClick={()=>step?move(step-1):onClose()} icon={step?<ChevronLeft size={17}/>:undefined}>{tr(step?'Indietro':'Annulla')}</Button><Button type="submit" form="entry-wizard" disabled={busy||step===0&&!chosenKind||step===1&&!form.category||step===2&&!form.subcategory||!categories.length} icon={step<3?<ChevronRight size={17}/>:<Check size={17}/>} >{tr(busy?'Salvataggio…':step<3?'Continua':'Salva movimento')}</Button></>}>
 <form id="entry-wizard" onSubmit={submit} noValidate className="entry-wizard" aria-busy={busy}>
 <Stepper steps={['Tipo','Categoria','Sottocategoria','Importo'].map(label=>({label:tr(label)}))} activeStep={step} ariaLabel={tr('Passaggi del movimento')}/>
 <fieldset disabled={busy} className="entry-step"><legend className="sr-only">{tr(['Tipo','Categoria','Sottocategoria','Importo e data'][step])}</legend>
 {step===0&&<><h3>{tr('Che movimento vuoi registrare?')}</h3><div className="entry-create-kind" role="group" aria-label={tr('Tipo')}>{(['expense','income'] as const).map(kind=><button type="button" key={kind} className={`entry-kind-option ${kind}`} aria-label={tr(kind==='expense'?'Spesa':'Entrata')} title={tr(kind==='expense'?'Spesa':'Entrata')} aria-pressed={chosenKind&&form.kind===kind} onClick={()=>{update({kind});setChosenKind(true);move(1);}}><span className="entry-kind-icon">{kind==='expense'?<ArrowUpRight size={22}/>:<ArrowDownLeft size={22}/>}</span><span className="entry-kind-label">{tr(kind==='expense'?'Spesa':'Entrata')}</span></button>)}</div></>}
 {(step===1||step===2)&&<><h3>{tr(step===1?'Scegli la categoria':'Scegli la sottocategoria')}</h3>{step===2&&<p className="muted">{selectedCategory?.name}</p>}<Input id="entry-category-search" placeholder={tr(step===1?'Cerca categoria…':'Cerca sottocategoria…')} icon={<Search size={18}/>} value={search} onChange={event=>setSearch(event.target.value)}/><div className="entry-pills" role="group" aria-label={tr(step===1?'Categoria':'Sottocategoria')}>
 {(step===1?filteredCategories:filteredSubcategories).map(item=>{const selected=(step===1?form.category:form.subcategory)===item._id;return <button type="button" key={item._id} className="entry-pill" aria-pressed={selected} onClick={()=>{update(step===1?{category:item._id,subcategory:item._id===form.category?form.subcategory:''}:{subcategory:item._id});move(step+1);}}><i style={{background:step===1?(item as Category).color:selectedCategory?.color}}/>{item.name}{selected&&<Check size={15}/>}</button>;})}</div>
 {!(step===1?filteredCategories:filteredSubcategories).length&&<p className="muted">{tr('Nessun risultato.')}</p>}{!categories.length&&<p className="form-error">{tr('Crea prima una categoria dalla pagina Management.')}</p>}</>}
 {step===3&&<><h3>{tr('Quanto e quando?')}</h3><div className="entry-amount-layout"><div><InputNumber id="entry-amount" autoFocus label={tr('Importo {{currency}}',{currency})} value={form.amount} allowDecimal inputMode="decimal" placeholder={new Intl.NumberFormat(locale(), {minimumFractionDigits:2}).format(0)} onChange={amount=>update({amount})}/></div><div className="entry-date-summary"><DatePicker id="entry-date" label={tr('Data')} value={new Date(form.date+'T12:00:00')} disabled={busy} onChange={date=>update({date:date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`:''})}/><p className="muted">{tr(form.kind==='income'?'Entrata':'Spesa')} · {selectedCategory?.name}{form.subcategory?' / '+subcategories.find(item=>item._id===form.subcategory)?.name:''}</p></div></div></>}
 </fieldset>{error&&<p className="form-error" role="alert">{tr(error)}</p>}
 </form></Modal>;
}

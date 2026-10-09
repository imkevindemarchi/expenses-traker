import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { getLiquidGlassClass } from '../assets/constants';
import { useTheme } from '../hooks';
import { locale, tr } from '../i18n';
import { today } from '../api';
export default function MonthPicker({value,onChange}: {value:string;onChange:(value:string)=>void}) {
  useTranslation(); const {theme}=useTheme(); const id=useId();
  const [open,setOpen]=useState(false); const [year,setYear]=useState(Number(value.slice(0,4)));
  const [position,setPosition]=useState<CSSProperties>({});
  const trigger=useRef<HTMLButtonElement>(null); const panel=useRef<HTMLDivElement>(null); const wrapper=useRef<HTMLDivElement>(null);
  const glass=getLiquidGlassClass(theme);
  const months=Array.from({length:12},(_,month)=>new Intl.DateTimeFormat(locale(),{month:'long'}).format(new Date(2020,month,1)));
  const selectedMonth=Number(value.slice(5,7))-1;
  const current=today().slice(0,7);
  const update=useCallback(()=>{
    if (!wrapper.current) return; const rect=wrapper.current.getBoundingClientRect();
    const width=Math.min(344,window.innerWidth-32); const height=panel.current?.offsetHeight || 370;
    setPosition({width,left:Math.min(Math.max(16,rect.left+rect.width/2-width/2),window.innerWidth-width-16),top:Math.max(12,Math.min(rect.bottom+12,window.innerHeight-height-12)),maxHeight:'calc(100dvh - 24px)',overflowY:'auto'});
  },[]);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  const select=(month:string)=>{onChange(month);close();};
  const shift=(direction:number)=>{
    const next=new Date(Number(value.slice(0,4)),selectedMonth+direction,1);
    const nextYear=next.getFullYear();if(nextYear<2000||nextYear>2100)return;
    onChange(`${nextYear}-${String(next.getMonth()+1).padStart(2,'0')}`);setOpen(false);
  };
  useEffect(()=>{
    if (!open) return; update();
    const outside=(event:PointerEvent)=>{if(!panel.current?.contains(event.target as Node)&&!wrapper.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();close();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('resize',update);window.addEventListener('scroll',update,true);
    panel.current?.querySelector<HTMLButtonElement>('[data-month][aria-selected="true"]')?.focus();
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);};
  },[open,update]);
  const key=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    const offset=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?3:event.key==='ArrowUp'?-3:0;
    if(offset){event.preventDefault();panel.current?.querySelector<HTMLButtonElement>(`[data-month="${(index+offset+12)%12}"]`)?.focus();}
  };
  return <>
    <div ref={wrapper} className="month-picker">
      <button type="button" className="month-step" aria-label={tr('Mese precedente')} title={tr('Mese precedente')} disabled={value==='2000-01'} onClick={()=>shift(-1)}><ChevronLeft size={18} strokeWidth={1.8}/></button>
      <button ref={trigger} type="button" className={`month-picker-trigger ${open?'is-open':''}`} aria-label={tr('Seleziona mese: {{month}}',{month:`${months[selectedMonth]} ${value.slice(0,4)}`})} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>{setYear(Number(value.slice(0,4)));setOpen(current=>!current);}}>
        <span className="month-picker-icon"><CalendarDays size={19} strokeWidth={1.7}/></span><span className="month-picker-value"><strong>{months[selectedMonth]}</strong><span>{value.slice(0,4)}</span></span><ChevronDown size={15} className={`month-picker-chevron ${open?'is-open':''}`}/>
      </button>
      <button type="button" className="month-step" aria-label={tr('Mese successivo')} title={tr('Mese successivo')} disabled={value==='2100-12'} onClick={()=>shift(1)}><ChevronRight size={18} strokeWidth={1.8}/></button>
    </div>
    {open&&createPortal(<div ref={panel} id={id} role="dialog" aria-label={tr('Seleziona mese')} style={position} className={`month-picker-panel ${glass} ${theme==='dark'?'month-picker-dark':''}`}>
      <div className="month-picker-panel-heading"><span className="month-picker-icon"><CalendarDays size={19} strokeWidth={1.7}/></span><div><h3>{tr('Scegli il mese')}</h3><p>{tr('La tua panoramica, un mese alla volta.')}</p></div></div>
      <div className="month-year-bar"><button type="button" disabled={year<=2000} aria-label={tr('Anno precedente')} className="month-step" onClick={()=>setYear(current=>current-1)}><ChevronLeft size={17}/></button><span aria-live="polite">{year}</span><button type="button" disabled={year>=2100} aria-label={tr('Anno successivo')} className="month-step" onClick={()=>setYear(current=>current+1)}><ChevronRight size={17}/></button></div>
      <div role="listbox" aria-label={tr('Mesi')} className="month-grid">{months.map((month,index)=>{const monthValue=`${year}-${String(index+1).padStart(2,'0')}`;const active=value===monthValue;return <button key={index} data-month={index} type="button" role="option" aria-selected={active} onKeyDown={event=>key(event,index)} onClick={()=>select(monthValue)} className={`month-tile ${active?'is-selected':''} ${current===monthValue?'is-current':''}`}><span>{month}</span>{active?<Check size={13} strokeWidth={2.4}/>:current===monthValue?<span className="month-current-dot" aria-label={tr('Mese corrente')}/>:null}</button>;})}</div>
      <button type="button" className="month-current" onClick={()=>select(current)}><RotateCcw size={14} strokeWidth={1.8}/>{tr('Torna al mese corrente')}</button>
    </div>,document.body)}
  </>;
}

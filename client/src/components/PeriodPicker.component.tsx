import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { getLiquidGlassClass } from '../assets/constants';
import { useTheme } from '../hooks';
import { locale, tr } from '../i18n';
import { today } from '../api';
export default function PeriodPicker({value,onChange,mode='month'}: {value:string;onChange:(value:string)=>void;mode?:'month'|'year'}) {
  useTranslation(); const {theme}=useTheme(); const id=useId();
  const [open,setOpen]=useState(false); const [year,setYear]=useState(Number(value.slice(0,4)));
  const [position,setPosition]=useState<CSSProperties>({});
  const trigger=useRef<HTMLButtonElement>(null); const panel=useRef<HTMLDivElement>(null); const wrapper=useRef<HTMLDivElement>(null);
  const glass=getLiquidGlassClass(theme);
  const months=Array.from({length:12},(_,month)=>new Intl.DateTimeFormat(locale(),{month:'long'}).format(new Date(2020,month,1)));
  const annual=mode==='year';
  const currentYear=Number(today().slice(0,4));
  const maxYear=annual?currentYear:2100;
  const selectedMonth=Number(value.slice(5,7))-1;
  const current=today().slice(0,annual?4:7);

  const options=annual?Array.from({length:maxYear-1999},(_,index)=>({value:String(maxYear-index),label:String(maxYear-index)})):months.map((month,index)=>({value:`${year}-${String(index+1).padStart(2,'0')}`,label:month}));
  const update=useCallback(()=>{
    if (!wrapper.current) return; const rect=wrapper.current.getBoundingClientRect();
    const width=Math.min(344,window.innerWidth-32); const height=panel.current?.offsetHeight || 370;
    setPosition({width,left:Math.min(Math.max(16,rect.left+rect.width/2-width/2),window.innerWidth-width-16),top:Math.max(12,Math.min(rect.bottom+12,window.innerHeight-height-12)),maxHeight:'calc(100dvh - 24px)',overflowY:'auto'});
  },[]);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  const select=(month:string)=>{onChange(month);close();};
  const shift=(direction:number)=>{
    if(annual){const next=Number(value)+direction;if(next>=2000&&next<=maxYear)onChange(String(next));setOpen(false);return;}
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
    const offset=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?(annual?1:3):event.key==='ArrowUp'?(annual?-1:-3):0;
    if(offset){event.preventDefault();panel.current?.querySelector<HTMLButtonElement>(`[data-month="${(index+offset+options.length)%options.length}"]`)?.focus();}
  };
  return <>
    <div ref={wrapper} className="month-picker">
      <button type="button" className="month-step" aria-label={tr(annual?'Anno precedente':'Mese precedente')} title={tr(annual?'Anno precedente':'Mese precedente')} disabled={value===(annual?'2000':'2000-01')} onClick={()=>shift(-1)}><ChevronLeft size={18} strokeWidth={1.8}/></button>
      <button ref={trigger} type="button" className={`month-picker-trigger ${open?'is-open':''}`} aria-label={annual?tr('Seleziona anno: {{year}}',{year:value}):tr('Seleziona mese: {{month}}',{month:`${months[selectedMonth]} ${value.slice(0,4)}`})} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>{setYear(Number(value.slice(0,4)));setOpen(current=>!current);}}>
        <span className="month-picker-icon"><CalendarDays size={19} strokeWidth={1.7}/></span><span className="month-picker-value"><strong>{annual?value:months[selectedMonth]}</strong><span>{annual?tr('Riepilogo annuale'):value.slice(0,4)}</span></span><ChevronDown size={15} className={`month-picker-chevron ${open?'is-open':''}`}/>
      </button>
      <button type="button" className="month-step" aria-label={tr(annual?'Anno successivo':'Mese successivo')} title={tr(annual?'Anno successivo':'Mese successivo')} disabled={value===(annual?String(maxYear):'2100-12')} onClick={()=>shift(1)}><ChevronRight size={18} strokeWidth={1.8}/></button>
    </div>
    {open&&createPortal(<div ref={panel} id={id} role="dialog" aria-label={tr(annual?'Seleziona anno':'Seleziona mese')} style={position} className={`month-picker-panel ${annual?"year-picker-panel":""} liquid-glass-panel liquid-glass-panel--open ${glass}`}>
      <div className="month-picker-panel-heading"><span className="month-picker-icon"><CalendarDays size={19} strokeWidth={1.7}/></span><div><h3>{tr(annual?'Scegli l’anno':'Scegli il mese')}</h3><p>{tr(annual?'La tua panoramica, un anno alla volta.':'La tua panoramica, un mese alla volta.')}</p></div></div>
      {!annual&&<div className="month-year-bar"><button type="button" disabled={year<=2000} aria-label={tr('Anno precedente')} className="month-step" onClick={()=>setYear(current=>current-1)}><ChevronLeft size={17}/></button><span aria-live="polite">{year}</span><button type="button" disabled={year>=maxYear} aria-label={tr('Anno successivo')} className="month-step" onClick={()=>setYear(current=>current+1)}><ChevronRight size={17}/></button></div>}
      <div role="listbox" aria-label={tr(annual?'Anni':'Mesi')} className={annual?"year-picker-list":"month-grid"}>{options.map((option,index)=>{const monthValue=option.value;const active=value===monthValue;return <button key={index} data-month={index} type="button" role="option" aria-selected={active} onKeyDown={event=>key(event,index)} onClick={()=>select(monthValue)} className={`month-tile ${active?'is-selected':''} ${current===monthValue?'is-current':''}`}><span>{option.label}</span>{active?<Check size={13} strokeWidth={2.4}/>:current===monthValue?<span className="month-current-dot" aria-label={tr(annual?'Anno corrente':'Mese corrente')}/>:null}</button>;})}</div>
      {value!==current&&<button type="button" className="month-current" onClick={()=>select(current)}><RotateCcw size={14} strokeWidth={1.8}/>{tr(annual?'Torna all’anno corrente':'Torna al mese corrente')}</button>}
    </div>,document.body)}
  </>;
}

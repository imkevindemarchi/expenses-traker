import Select from '../components/Select.component';
import {CURRENCIES} from '../contexts/currency.context';
import {useMoney} from '../contexts/currency.context';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save, LockKeyhole, Eye, EyeOff, Trash2, TriangleAlert, X, UserRound } from 'lucide-react';
import { api } from '../api';
import { tr } from '../i18n';
import type { User } from '../types';
import Glass from '../components/Glass.component';
import InputNumber from '../components/InputNumber.component';
import Accordion from '../components/Accordion.component';
import Input from '../components/Input.component';
import Button from '../components/Button.component';
import FloatingButton from '../components/FloatingButton.component';
export default function SettingsPage({user,onSaved,onNotice,onDeleted}: {user:User;onSaved:(user:User)=>void;onNotice:(error:boolean,message:string)=>void;onDeleted:()=>void}) {
  const money=useMoney();
  useTranslation();
  const [amount,setAmount] = useState(user.monthlyBudgetCents == null ? '' : (user.monthlyBudgetCents / 100).toFixed(2));
  const [currency,setCurrency]=useState(user.currency??'EUR');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [passwords,setPasswords]=useState({currentPassword:'',newPassword:'',confirmPassword:''});
  const [showPasswords,setShowPasswords]=useState(false);
  const [profile,setProfile]=useState({name:user.name??'',surname:user.surname??''});
  const [deleteConfirm,setDeleteConfirm]=useState(false);
  const [deleteBusy,setDeleteBusy]=useState(false);
  const [deleteError,setDeleteError]=useState('');
  const removeAccount=async()=>{
    if(!deleteConfirm||deleteBusy||busy)return;
    setDeleteBusy(true);setDeleteError('');
    try{await api('/account',{method:'DELETE',body:{confirm:true}});onDeleted();}
    catch(cause){setDeleteError(cause instanceof Error?cause.message:'Si è verificato un errore.');}
    finally{setDeleteBusy(false);}
  };
  const save = async (event:FormEvent) => {
    event.preventDefault(); if (busy||deleteBusy) return;
    setError('');
    if (amount !== '' && (!/^\d{1,7}([.,]\d{1,2})?$/.test(amount) || Number(amount.replace(',','.')) > 1_000_000)) {setError('Inserisci un limite tra 0 e 1.000.000, con massimo due decimali.');return;}
    const passwordChanged=Object.values(passwords).some(Boolean);
    if(passwordChanged){
      if(!passwords.currentPassword){setError('Inserisci la password attuale.');return;}
      if(passwords.newPassword.length<10||new TextEncoder().encode(passwords.newPassword).length>72){setError('La password deve avere almeno 10 caratteri e non superare 72 byte.');return;}
      if(passwords.newPassword!==passwords.confirmPassword){setError('Le nuove password non coincidono.');return;}
      if(passwords.newPassword===passwords.currentPassword){setError('Scegli una password diversa da quella attuale.');return;}
    }
    setBusy(true);
    try {const result=await api<{user:User}>('/account/settings',{method:'PATCH',body:{...profile,monthlyBudget:amount,currency,...(passwordChanged?{passwordChange:passwords}:{})}});onSaved(result.user);setProfile({name:result.user.name,surname:result.user.surname??''});setPasswords({currentPassword:'',newPassword:'',confirmPassword:''});setShowPasswords(false);onNotice(false,'Impostazioni salvate.');}
    catch (cause) {setError(cause instanceof Error ? cause.message : 'Si è verificato un errore.');}
    finally {setBusy(false);}
  };
  return <><form id="account-settings-form" className="settings-sections" onSubmit={save} noValidate aria-busy={busy}><Glass className="panel settings-panel"><Accordion className="settings-accordion" contentClassName="settings-accordion-content" ariaLabel={tr('Profilo')} header={<div className="settings-heading"><span className="round-icon"><UserRound size={22}/></span><div><h2>{tr('Profilo')}</h2><p className="muted">{tr('Aggiungi il tuo nome e cognome. Entrambi i campi sono facoltativi.')}</p></div></div>}><div className="form-stack"><div className="settings-profile-fields"><Input id="account-name" label={tr('Nome')} placeholder={tr('Nome')} autoComplete="given-name" maxLength={60} disabled={busy||deleteBusy} value={profile.name} onChange={event=>setProfile(value=>({...value,name:event.target.value}))}/><Input id="account-surname" label={tr('Cognome')} placeholder={tr('Cognome')} autoComplete="family-name" maxLength={60} disabled={busy||deleteBusy} value={profile.surname} onChange={event=>setProfile(value=>({...value,surname:event.target.value}))}/></div></div></Accordion></Glass>
  <Glass className="panel settings-panel"><Accordion className="settings-accordion" contentClassName="settings-accordion-content" ariaLabel={tr('Valuta e budget mensile')} header={<div className="settings-heading"><span className="round-icon"><Settings size={22}/></span><div><h2>{tr('Valuta e budget mensile')}</h2><p className="muted">{tr('Imposta quanto puoi spendere ogni mese. Il limite è personale e viene salvato nel tuo account.')}</p></div></div>}>
    <div className="form-stack">
      <Select id="account-currency" label={tr('Valuta dell’account')} value={currency} options={CURRENCIES.map(value=>({value,label:tr('currency.'+value)}))} onChange={setCurrency} disabled={busy}/>
      <p className="muted">{tr('Cambiare valuta non converte gli importi già registrati.')}</p>
      <InputNumber id="monthly-budget" label={tr('Limite di spesa mensile {{currency}}',{currency})} placeholder="0,00" icon={<span className="text-xs">{currency}</span>} allowDecimal value={amount} disabled={busy} error={error ? tr(error) : undefined} onChange={value=>{setAmount(value);setError('');}} />
      <p className="muted">{tr('Lascia il campo vuoto per non impostare un limite. Il budget residuo compare solo nella panoramica del mese corrente.')}</p>
      {user.monthlyBudgetCents != null && <p className="muted">{tr('Limite attuale: {{amount}}',{amount:money(user.monthlyBudgetCents)})}</p>}
      
    </div></Accordion>
  </Glass><Glass className="panel settings-panel"><Accordion className="settings-accordion" contentClassName="settings-accordion-content" ariaLabel={tr('Cambia password')} header={<div className="settings-heading"><span className="round-icon"><LockKeyhole size={22}/></span><div><h2>{tr('Cambia password')}</h2><p className="muted">{tr('Usa almeno 10 caratteri. Dopo il cambio, le altre sessioni dovranno accedere di nuovo.')}</p></div></div>}><div className="form-stack">
  {([{key:'currentPassword',label:'Password attuale',autoComplete:'current-password'},{key:'newPassword',label:'Nuova password',autoComplete:'new-password'},{key:'confirmPassword',label:'Conferma nuova password',autoComplete:'new-password'}] as const).map(({key,label,autoComplete})=><Input key={key} id={`account-${key}`} aria-label={tr(label)} placeholder={tr(label)} type={showPasswords?'text':'password'} autoComplete={autoComplete} disabled={busy||deleteBusy} value={passwords[key]} icon={<LockKeyhole size={17}/>} endIcon={showPasswords?<EyeOff size={18}/>:<Eye size={18}/>} endIconAriaLabel={tr(showPasswords?'Nascondi password':'Mostra password')} onEndIconClick={()=>setShowPasswords(value=>!value)} onChange={event=>{setPasswords(value=>({...value,[key]:event.target.value}));setError('');}}/>)}
  </div></Accordion></Glass>
  <Glass className="panel settings-panel"><Accordion className="settings-accordion" contentClassName="settings-accordion-content" ariaLabel={tr('Elimina account')} header={<div className="settings-heading"><span className="round-icon expense-text"><Trash2 size={22}/></span><div><h2>{tr('Elimina account')}</h2><p className="muted">{tr('Elimina definitivamente il tuo account e tutti i dati associati.')}</p></div></div>}>
  <div className={`settings-delete-box ${deleteConfirm?'is-confirming':''}`}><div className="settings-delete-row"><span className="settings-delete-icon">{deleteConfirm?<TriangleAlert size={20}/>:<Trash2 size={20}/>}</span><div className="settings-delete-copy"><strong>{tr(deleteConfirm?'Eliminare il tuo account?':'Elimina account')}</strong><p className="muted">{deleteConfirm?<>{user.email}<br/>{tr('Il tuo account, tutti i movimenti, le categorie e le sottocategorie saranno eliminati. Questa operazione non può essere annullata.')}</>:tr('Elimina definitivamente il tuo account e tutti i dati associati.')}</p></div></div><div className="settings-delete-actions">{deleteConfirm?<><Button variant="secondary" disabled={deleteBusy} icon={<X size={16}/>} onClick={()=>{setDeleteConfirm(false);setDeleteError('');}}>{tr('Annulla')}</Button><Button variant="danger" disabled={deleteBusy||busy} icon={<Trash2 size={16}/>} onClick={()=>{void removeAccount();}}>{tr(deleteBusy?'Eliminazione…':'Elimina definitivamente')}</Button></>:<Button variant="danger" disabled={busy||deleteBusy} icon={<Trash2 size={16}/>} onClick={()=>{setDeleteError('');setDeleteConfirm(true);}}>{tr('Elimina account')}</Button>}</div>{deleteError&&<p className="form-error" role="alert">{tr(deleteError)}</p>}</div></Accordion></Glass>
  {error&&<p className="form-error settings-panel" role="alert">{tr(error)}</p>}</form><div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2"><FloatingButton type="submit" form="account-settings-form" ariaLabel={tr(busy?'Salvataggio…':'Salva impostazioni')} icon={<Save size={27}/>} disabled={busy||deleteBusy}/></div></>;
}

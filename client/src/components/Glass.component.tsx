import type { PropsWithChildren } from 'react';
import { useTheme } from '../hooks';
export default function Glass({children,className=''}:PropsWithChildren<{className?:string}>) {
 const {theme}=useTheme();
 const metric=className.split(' ').includes('stat-card');
 const hero=className.split(' ').includes('balance-card');
 const surface=hero ? (theme==='light'?'border-primary/15 bg-primary/4.5':'border-primary/18 bg-primary/6.5') : metric ? (theme==='light'?'border-black/6 bg-black/[0.018]':'border-white/7 bg-white/2.5') : (theme==='light'?'border-lightgray shadow-lightshadow':'border-darkgray shadow-darkshadow');
 return <section className={`analytics-surface relative isolate overflow-hidden rounded-3xl border transition-[border-color,background-color,box-shadow] duration-300 ${surface} ${className}`}><div className="relative z-10 h-full">{children}</div></section>;
}

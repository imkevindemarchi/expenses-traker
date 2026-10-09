import { createContext } from 'react';
export type ThemePreference = 'system' | 'dark' | 'light';
export const ThemeContext = createContext<{ theme: 'light' | 'dark'; preference:ThemePreference; setPreference:(value:ThemePreference)=>void }>({ theme: 'light', preference:'system', setPreference:()=>{} });

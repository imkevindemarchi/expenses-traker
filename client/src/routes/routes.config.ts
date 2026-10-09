import { ChartNoAxesCombined, ListOrdered, Shapes, Settings, CalendarRange } from 'lucide-react';
export const ROUTE_PATHS = { login: '/login', register: '/register', dashboard: '/', entries: '/entries', management: '/management', settings: '/settings', annual:'/annual' } as const;
export type Page = 'dashboard' | 'entries' | 'management' | 'settings' | 'annual';
export const PROTECTED_ROUTES = [
  { path: ROUTE_PATHS.dashboard, name: 'dashboard', icon: ChartNoAxesCombined },
  { path: ROUTE_PATHS.annual, name: 'annual', icon: CalendarRange },
  { path: ROUTE_PATHS.entries, name: 'entries', icon: ListOrdered },
  { path: ROUTE_PATHS.management, name: 'management', icon: Shapes },
  { path: ROUTE_PATHS.settings, name: 'settings', icon: Settings, is_hidden: true },
];
export const pageFromPath = (path: string): Page => PROTECTED_ROUTES.find(route => route.path === path)?.name as Page || 'dashboard';
export const safeReturnPath = (path: unknown): string => typeof path === 'string' && PROTECTED_ROUTES.some(route => route.path === path) ? path : ROUTE_PATHS.dashboard;

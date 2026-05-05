import { createContext, useContext } from 'react';
import type { Page, Toast, Tweaks, Oferta, EstadoOferta } from './types';

export interface AppState {
  page: Page;
  ofertaId: string | null;
  ofertasView: 'kanban' | 'cards' | 'list';
  dark: boolean;
  nuevaOpen: boolean;
  tweaks: Tweaks;
  ofertas: Oferta[];
  toasts: Toast[];
}

export interface AppActions {
  setPage: (page: Page, ofertaId?: string) => void;
  setOfertasView: (view: 'kanban' | 'cards' | 'list') => void;
  toggleDark: () => void;
  setNuevaOpen: (open: boolean) => void;
  setTweaks: (tweaks: Partial<Tweaks>) => void;
  moveOferta: (id: string, estado: EstadoOferta) => void;
  addOferta: (oferta: Oferta) => void;
  showToast: (message: string, variant: Toast['variant']) => void;
  dismissToast: (id: string) => void;
}

export type AppContext = AppState & AppActions;

export const AppCtx = createContext<AppContext | null>(null);

export function useApp(): AppContext {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

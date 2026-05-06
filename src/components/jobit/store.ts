import { createContext, useContext } from 'react';
import type { Page, Toast, Tweaks, Oferta, EstadoOferta, Empresa, Contacto, CvItem, PerfilUsuario, ActivityItem, NotaItem, PasoRoadmap } from './types';

export interface AppState {
  page: Page;
  ofertaId: string | null;
  ofertasView: 'kanban' | 'cards' | 'list';
  dark: boolean;
  nuevaOpen: boolean;
  tweaks: Tweaks;
  ofertas: Oferta[];
  empresas: Record<string, Empresa>;
  contactos: Record<string, Contacto>;
  cvs: CvItem[];
  perfil: PerfilUsuario | null;
  actividadLog: ActivityItem[];
  notas: NotaItem[];
  roadmapPasos: Record<string, PasoRoadmap[]>;
  ofertaContactos: Record<string, string[]>;
  toasts: Toast[];
  loading: boolean;
  error: string | null;
}

export interface AppActions {
  setPage: (page: Page, ofertaId?: string) => void;
  setOfertasView: (view: 'kanban' | 'cards' | 'list') => void;
  toggleDark: () => void;
  setNuevaOpen: (open: boolean) => void;
  setTweaks: (tweaks: Partial<Tweaks>) => void;
  moveOferta: (id: string, estado: EstadoOferta) => Promise<void>;
  addOferta: (oferta: Oferta) => Promise<void>;
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

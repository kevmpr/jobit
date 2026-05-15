import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Page, Toast, Tweaks, Oferta, EstadoOferta, Empresa, Contacto, CvItem, PerfilUsuario, ActivityItem, NotaItem, PasoRoadmap, Plataforma, Experiencia, Educacion, Caso } from './types';

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
  cvs: Record<string, CvItem>;
  perfil: PerfilUsuario | null;
  actividadLog: ActivityItem[];
  notas: NotaItem[];
  roadmapPasos: Record<string, PasoRoadmap[]>;
  ofertaContactos: Record<string, string[]>;
  plataformas: Record<string, Plataforma>;
  experiencia: Experiencia[];
  educacion: Educacion[];
  casos: Caso[];
  toasts: Toast[];
  loading: boolean;
  error: string | null;
  currentUser: User | null;
  sidebarOpen: boolean;
}

export interface AppActions {
  setPage: (page: Page, ofertaId?: string) => void;
  setOfertasView: (view: 'kanban' | 'cards' | 'list') => void;
  toggleDark: () => void;
  setNuevaOpen: (open: boolean) => void;
  setTweaks: (tweaks: Partial<Tweaks>) => void;
  moveOferta: (id: string, estado: EstadoOferta) => Promise<void>;
  addOferta: (oferta: Oferta) => Promise<void>;
  addEmpresa: (empresa: Empresa) => void;
  updateEmpresa: (id: string, data: Partial<Empresa>) => void;
  deleteEmpresa: (id: string) => void;
  addContacto: (contacto: Contacto) => void;
  updateContacto: (id: string, data: Partial<Contacto>) => void;
  deleteContacto: (id: string) => void;
  addPlataforma: (plataforma: Plataforma) => void;
  updatePlataforma: (id: string, data: Partial<Plataforma>) => void;
  deletePlataforma: (id: string) => void;
  addOfertaContacto: (ofertaId: string, contactoId: string) => Promise<void>;
  removeOfertaContacto: (ofertaId: string, contactoId: string) => Promise<void>;
  updateOfertaPasos: (ofertaId: string, pasos: PasoRoadmap[]) => void;
  showToast: (message: string, variant: Toast['variant']) => void;
  dismissToast: (id: string) => void;
  setNotas: (notas: NotaItem[]) => void;
  addCV: (cv: CvItem) => void;
  removeCV: (id: string) => void;
  updatePerfil: (data: Partial<PerfilUsuario>) => Promise<void>;
  addExperiencia: (data: Omit<Experiencia, 'id'>) => Promise<void>;
  updateExperiencia: (id: string, data: Partial<Experiencia>) => Promise<void>;
  deleteExperiencia: (id: string) => Promise<void>;
  addEducacion: (data: Omit<Educacion, 'id'>) => Promise<void>;
  updateEducacion: (id: string, data: Partial<Educacion>) => Promise<void>;
  deleteEducacion: (id: string) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  fetchCasos: () => Promise<void>;
  addCaso: (data: Partial<Caso>) => Promise<void>;
  updateCaso: (id: string, data: Partial<Caso>) => Promise<void>;
  deleteCaso: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshing: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
}

export type AppContext = AppState & AppActions;

export const AppCtx = createContext<AppContext | null>(null);

export function useApp(): AppContext {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

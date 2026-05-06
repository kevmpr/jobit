import React, { useState, useCallback, useEffect } from 'react';
import { AppCtx } from './jobit/store';
import type { AppState } from './jobit/store';
import type { Page, Toast, Tweaks, Oferta, EstadoOferta, Empresa, Contacto, CvItem, PerfilUsuario, ActivityItem, NotaItem, PasoRoadmap } from './jobit/types';
import {
  fetchOfertas,
  fetchEmpresas,
  fetchContactos,
  fetchCVs,
  fetchPerfil,
  fetchActividadLog,
  fetchNotas,
  fetchAllRoadmapPasos,
  fetchAllOfertaContactos,
  moveOferta as dbMoveOferta,
  addOferta as dbAddOferta,
} from '../lib/db';
import { Sidebar, Topbar } from './jobit/Shell';
import { Dashboard } from './jobit/Dashboard';
import { Ofertas } from './jobit/Ofertas';
import { OfertaDetail } from './jobit/OfertaDetail';
import { Comparar } from './jobit/Comparar';
import { Perfil, CVs, Contactos, Empresas, Notas, Configuracion } from './jobit/ExtraPages';
import { ToastContainer, NuevaOfertaModal } from './jobit/Interactions';

import '../styles/global.css';

export default function JobitApp() {
  const [page, setPageState] = useState<Page>('dashboard');
  const [ofertaId, setOfertaId] = useState<string | null>(null);
  const [ofertasView, setOfertasView] = useState<'kanban' | 'cards' | 'list'>('kanban');
  const [dark, setDark] = useState(false);
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [tweaks, setTweaksState] = useState<Tweaks>({
    hue: 250, density: 'comfortable', sidebar: 'expanded', roadmap: 'vertical', card: 'default', font: 'geist',
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Supabase data state
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, Empresa>>({});
  const [contactos, setContactos] = useState<Record<string, Contacto>>({});
  const [cvs, setCvs] = useState<CvItem[]>([]);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [actividadLog, setActividadLog] = useState<ActivityItem[]>([]);
  const [notas, setNotas] = useState<NotaItem[]>([]);
  const [roadmapPasos, setRoadmapPasos] = useState<Record<string, PasoRoadmap[]>>({});
  const [ofertaContactos, setOfertaContactos] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [
          ofertasData,
          empresasData,
          contactosData,
          cvsData,
          perfilData,
          actividadData,
          notasData,
          roadmapData,
          contactosOfertaData,
        ] = await Promise.all([
          fetchOfertas(),
          fetchEmpresas(),
          fetchContactos(),
          fetchCVs(),
          fetchPerfil(),
          fetchActividadLog(),
          fetchNotas(),
          fetchAllRoadmapPasos(),
          fetchAllOfertaContactos(),
        ]);

        if (cancelled) return;

        // Build lookup maps
        const empresasMap: Record<string, Empresa> = {};
        for (const e of empresasData) empresasMap[e.id] = e;

        const contactosMap: Record<string, Contacto> = {};
        for (const c of contactosData) contactosMap[c.id] = c;

        // Attach contacto ids to ofertas from oferta_contactos junction
        const enrichedOfertas = ofertasData.map((o) => ({
          ...o,
          contactos: contactosOfertaData[o.id] ?? [],
        }));

        setOfertas(enrichedOfertas);
        setEmpresas(empresasMap);
        setContactos(contactosMap);
        setCvs(cvsData);
        setPerfil(perfilData);
        setActividadLog(actividadData);
        setNotas(notasData);
        setRoadmapPasos(roadmapData);
        setOfertaContactos(contactosOfertaData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar los datos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Sync dark mode with html element
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const setPage = useCallback((p: Page, id?: string) => {
    setPageState(p);
    if (id !== undefined) setOfertaId(id);
  }, []);

  const toggleDark = useCallback(() => setDark((d) => !d), []);

  const setTweaks = useCallback((t: Partial<Tweaks>) => {
    setTweaksState((prev) => ({ ...prev, ...t }));
  }, []);

  const moveOferta = useCallback(async (id: string, estado: EstadoOferta) => {
    // Optimistic update
    setOfertas((prev) => prev.map((o) =>
      o.id === id ? { ...o, estado, actualizadoEn: new Date().toISOString().slice(0, 10) } : o
    ));
    try {
      await dbMoveOferta(id, estado);
    } catch {
      // Revert on error — refetch
      const fresh = await fetchOfertas();
      setOfertas(fresh.map((o) => ({ ...o, contactos: ofertaContactos[o.id] ?? [] })));
    }
  }, [ofertaContactos]);

  const addOferta = useCallback(async (oferta: Oferta) => {
    // Optimistic update
    setOfertas((prev) => [oferta, ...prev]);
    try {
      await dbAddOferta(oferta);
    } catch {
      // Revert on error
      setOfertas((prev) => prev.filter((o) => o.id !== oferta.id));
    }
  }, []);

  const showToast = useCallback((message: string, variant: Toast['variant']) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--surface-sunken)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--color-brand)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando Jobit…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div style={{ fontSize: 14, color: 'oklch(0.50 0.22 25)' }}>Error: {error}</div>
    </div>
  );

  const ctx: AppState & {
    setPage: (page: Page, ofertaId?: string) => void;
    setOfertasView: (view: 'kanban' | 'cards' | 'list') => void;
    toggleDark: () => void;
    setNuevaOpen: (open: boolean) => void;
    setTweaks: (tweaks: Partial<Tweaks>) => void;
    moveOferta: (id: string, estado: EstadoOferta) => Promise<void>;
    addOferta: (oferta: Oferta) => Promise<void>;
    showToast: (message: string, variant: Toast['variant']) => void;
    dismissToast: (id: string) => void;
  } = {
    page, ofertaId, ofertasView, dark, nuevaOpen, tweaks,
    ofertas, empresas, contactos, cvs, perfil, actividadLog, notas, roadmapPasos, ofertaContactos,
    toasts, loading, error,
    setPage, setOfertasView, toggleDark, setNuevaOpen, setTweaks,
    moveOferta, addOferta, showToast, dismissToast,
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'ofertas': return <Ofertas />;
      case 'oferta-detail': return <OfertaDetail />;
      case 'comparar': return <Comparar />;
      case 'perfil': return <Perfil />;
      case 'cvs': return <CVs />;
      case 'contactos': return <Contactos />;
      case 'empresas': return <Empresas />;
      case 'notas': return <Notas />;
      case 'configuracion': return <Configuracion />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div
        className="app"
        data-density={tweaks.density}
        data-sidebar={tweaks.sidebar}
        data-card={tweaks.card}
      >
        <Sidebar onNewOferta={() => setNuevaOpen(true)} />
        <div className="main-area">
          <Topbar />
          <div style={{ flex: 1, overflow: page === 'notas' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {renderPage()}
          </div>
        </div>
      </div>
      <NuevaOfertaModal />
      <ToastContainer />
    </AppCtx.Provider>
  );
}

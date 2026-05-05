import React, { useState, useCallback, useEffect } from 'react';
import { AppCtx } from './jobit/store';
import type { AppState } from './jobit/store';
import type { Page, Toast, Tweaks, Oferta, EstadoOferta } from './jobit/types';
import { ofertas as initialOfertas } from './jobit/data';
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
  const [ofertas, setOfertas] = useState<Oferta[]>(initialOfertas);
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const moveOferta = useCallback((id: string, estado: EstadoOferta) => {
    setOfertas((prev) => prev.map((o) => o.id === id ? { ...o, estado, actualizadoEn: new Date().toISOString().slice(0, 10) } : o));
  }, []);

  const addOferta = useCallback((oferta: Oferta) => {
    setOfertas((prev) => [oferta, ...prev]);
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

  const ctx = {
    page, ofertaId, ofertasView, dark, nuevaOpen, tweaks, ofertas, toasts,
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

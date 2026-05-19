import { useState, useCallback, useEffect, Component, ReactNode } from 'react';

// ---- Error Boundary ----
interface EBState { error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: 'white', background: '#0f172a', minHeight: '100vh' }}>
          <h2 style={{ marginBottom: 12 }}>Error al cargar la aplicación</h2>
          <pre style={{ color: '#f87171', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { AppCtx } from './jobit/store';
import type { AppState } from './jobit/store';
import type { Page, Toast, Tweaks, Oferta, EstadoOferta, Empresa, Contacto, CvItem, PerfilUsuario, ActivityItem, NotaItem, PasoRoadmap, Plataforma, Experiencia, Educacion, Caso } from './jobit/types';
import type { User } from '@supabase/supabase-js';
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
  fetchPlataformas,
  fetchExperiencia,
  fetchEducacion,
  fetchCasos as dbFetchCasos,
  addCaso as dbAddCaso,
  updateCaso as dbUpdateCaso,
  deleteCaso as dbDeleteCaso,
  moveOferta as dbMoveOferta,
  addOferta as dbAddOferta,
  addEmpresa as dbAddEmpresa,
  updateEmpresa as dbUpdateEmpresa,
  deleteEmpresa as dbDeleteEmpresa,
  addContacto as dbAddContacto,
  updateContacto as dbUpdateContacto,
  deleteContacto as dbDeleteContacto,
  addOfertaContacto as dbAddOfertaContacto,
  removeOfertaContacto as dbRemoveOfertaContacto,
  addPlataforma as dbAddPlataforma,
  updatePlataforma as dbUpdatePlataforma,
  deletePlataforma as dbDeletePlataforma,
  updatePerfil as dbUpdatePerfil,
  addExperiencia as dbAddExperiencia,
  updateExperiencia as dbUpdateExperiencia,
  deleteExperiencia as dbDeleteExperiencia,
  addEducacion as dbAddEducacion,
  updateEducacion as dbUpdateEducacion,
  deleteEducacion as dbDeleteEducacion,
  uploadAvatar as dbUploadAvatar,
  linkCVToOferta as dbLinkCVToOferta,
} from '../lib/db';
import { supabase } from '../lib/supabase';
import { Sidebar, Topbar } from './jobit/Shell';
import { Dashboard } from './jobit/Dashboard';
import { Ofertas } from './jobit/Ofertas';
import { OfertaDetail } from './jobit/OfertaDetail';
import { Comparar } from './jobit/Comparar';
import { Perfil, CVs, Contactos, Empresas, Plataformas, Configuracion } from './jobit/ExtraPages';
import { CasosPage } from './jobit/Casos';
import { ToastContainer, NuevaOfertaModal } from './jobit/Interactions';

import '../styles/global.css';

export default function JobitApp() {
  const [page, setPageState] = useState<Page>('dashboard');
  const [ofertaId, setOfertaId] = useState<string | null>(null);
  const [ofertasView, setOfertasView] = useState<'kanban' | 'cards' | 'list'>('kanban');
  const [dark, setDark] = useState(false);
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [tweaks, setTweaksState] = useState<Tweaks>({
    hue: 250, density: 'comfortable', sidebar: 'expanded', card: 'default', font: 'geist',
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Supabase data state
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, Empresa>>({});
  const [contactos, setContactos] = useState<Record<string, Contacto>>({});
  const [cvs, setCvs] = useState<Record<string, CvItem>>({});
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [actividadLog, setActividadLog] = useState<ActivityItem[]>([]);
  const [notas, setNotas] = useState<NotaItem[]>([]);
  const [roadmapPasos, setRoadmapPasos] = useState<Record<string, PasoRoadmap[]>>({});
  const [ofertaContactos, setOfertaContactos] = useState<Record<string, string[]>>({});
  const [plataformas, setPlataformas] = useState<Record<string, Plataforma>>({});
  const [experiencia, setExperiencia] = useState<Experiencia[]>([]);
  const [educacion, setEducacion] = useState<Educacion[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync auth user — redirect to /login only after a definitive no-session confirmation.
  // onAuthStateChange fires INITIAL_SESSION with null before cookies are resolved on
  // first hydration after OAuth redirect, so we must NOT redirect on that event alone.
  useEffect(() => {
    // Authoritative session check: getSession() reads cookies synchronously in the
    // browser client, so it resolves the session even on the very first hydration.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setCurrentUser(session.user);
    });

    // Only react to explicit sign-out events. INITIAL_SESSION / TOKEN_REFRESHED /
    // SIGNED_IN events are handled by the getSession() call above on mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
        return;
      }
      if (session?.user) {
        setCurrentUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Shared fetch logic — used on mount and for manual refresh
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

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
        plataformasData,
        experienciaData,
        educacionData,
        casosData,
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
        fetchPlataformas(),
        userId ? fetchExperiencia(userId) : Promise.resolve([]),
        userId ? fetchEducacion(userId) : Promise.resolve([]),
        userId ? dbFetchCasos(userId) : Promise.resolve([]),
      ]);

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
      // Compute ofertasUsadas: count how many enrichedOfertas reference each CV
      const cvUsageCount: Record<string, number> = {};
      for (const o of enrichedOfertas) {
        const id = o.cvEnviadoId ?? o.cvEnviado;
        if (id) cvUsageCount[id] = (cvUsageCount[id] ?? 0) + 1;
      }
      const cvsMap: Record<string, CvItem> = {};
      for (const cv of cvsData) cvsMap[cv.id] = { ...cv, ofertasUsadas: cvUsageCount[cv.id] ?? 0 };
      setCvs(cvsMap);
      setPerfil(perfilData);
      setActividadLog(actividadData);
      setNotas(notasData);
      setRoadmapPasos(roadmapData);
      setOfertaContactos(contactosOfertaData);
      setPlataformas(plataformasData);
      setExperiencia(experienciaData);
      setEducacion(educacionData);
      setCasos(casosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        await refreshAll();
      } catch {
        // errors handled inside refreshAll
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const setTweaks = useCallback((t: Partial<Tweaks>) => {
    setTweaksState((prev) => ({ ...prev, ...t }));
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
    // Use crypto.randomUUID() so the id is always a valid UUID accepted by Supabase
    const id = crypto.randomUUID();
    // Normalize empresa: the type expects string, never null
    const empresa = oferta.empresa ?? '';
    const ofertaWithId = { ...oferta, id, empresa };
    // Optimistic update — add to state immediately so the card appears right away
    setOfertas((prev) => [ofertaWithId, ...prev]);
    try {
      // Always resolve the current user id from the live session, not just from state,
      // so the insert succeeds even if the component mounted before getSession() resolved.
      const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      await dbAddOferta(ofertaWithId, userId);
      const freshOfertas = await fetchOfertas();
      setOfertas(freshOfertas.map((o) => ({ ...o, contactos: ofertaContactos[o.id] ?? [] })));
    } catch (err) {
      console.error('[jobit] addOferta error (full):', err);
      // Do NOT revert the optimistic update immediately — refetch instead.
      // If the insert actually succeeded, the refetch will include the new offer.
      // If it genuinely failed, the refetch won't include it (correct behavior).
      try {
        const freshOfertas = await fetchOfertas();
        setOfertas(freshOfertas.map((o) => ({ ...o, contactos: ofertaContactos[o.id] ?? [] })));
      } catch (fetchErr) {
        console.error('[jobit] addOferta fallback refetch also failed:', fetchErr);
      }
      showToast('Error al guardar la oferta. Por favor intenta de nuevo.', 'error');
    }
  }, [currentUser, ofertaContactos, showToast]);

  const addEmpresa = useCallback((empresa: Empresa) => {
    // The modal already persisted to DB and returns the real empresa — just update state
    setEmpresas((prev) => ({ ...prev, [empresa.id]: empresa }));
  }, []);

  const updateEmpresa = useCallback((id: string, data: Partial<Empresa>) => {
    // Optimistic update
    setEmpresas((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return { ...prev, [id]: { ...existing, ...data } };
    });
    dbUpdateEmpresa(id, data).catch(() => {
      // Revert on error — refetch empresas
      fetchEmpresas().then((fresh) => {
        const map: Record<string, Empresa> = {};
        for (const e of fresh) map[e.id] = e;
        setEmpresas(map);
      });
    });
  }, []);

  const deleteEmpresa = useCallback((id: string) => {
    // Optimistic update — remove from map immediately
    setEmpresas((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    dbDeleteEmpresa(id).catch(() => {
      // Revert on error — refetch empresas
      fetchEmpresas().then((fresh) => {
        const map: Record<string, Empresa> = {};
        for (const e of fresh) map[e.id] = e;
        setEmpresas(map);
      });
    });
  }, []);

  const addContacto = useCallback((contacto: Contacto) => {
    // The modal already persisted to DB and returns the real contacto — just update state
    setContactos((prev) => ({ ...prev, [contacto.id]: contacto }));
  }, []);

  const updateContacto = useCallback((id: string, data: Partial<Contacto>) => {
    // Optimistic update
    setContactos((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return { ...prev, [id]: { ...existing, ...data } };
    });
    dbUpdateContacto(id, data).catch(() => {
      // Revert on error — refetch contactos
      fetchContactos().then((fresh) => {
        const map: Record<string, Contacto> = {};
        for (const c of fresh) map[c.id] = c;
        setContactos(map);
      });
    });
  }, []);

  const deleteContacto = useCallback((id: string) => {
    // Optimistic update — remove from map immediately
    setContactos((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    dbDeleteContacto(id).catch(() => {
      // Revert on error — refetch contactos
      fetchContactos().then((fresh) => {
        const map: Record<string, Contacto> = {};
        for (const c of fresh) map[c.id] = c;
        setContactos(map);
      });
    });
  }, []);

  const addPlataforma = useCallback((plataforma: Plataforma) => {
    setPlataformas((prev) => ({ ...prev, [plataforma.id]: plataforma }));
  }, []);

  const updatePlataforma = useCallback((id: string, data: Partial<Plataforma>) => {
    setPlataformas((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return { ...prev, [id]: { ...existing, ...data } };
    });
    dbUpdatePlataforma(id, data).catch(() => {
      fetchPlataformas().then((fresh) => setPlataformas(fresh));
    });
  }, []);

  const deletePlataforma = useCallback((id: string) => {
    setPlataformas((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    dbDeletePlataforma(id).catch(() => {
      fetchPlataformas().then((fresh) => setPlataformas(fresh));
    });
  }, []);

  const addCV = useCallback((cv: CvItem) => {
    setCvs((prev) => ({ ...prev, [cv.id]: cv }));
  }, []);

  const removeCV = useCallback((id: string) => {
    setCvs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const linkCVToOferta = useCallback(async (ofertaId: string, cvId: string | null) => {
    // Optimistic update — reflect the change immediately in local state
    setOfertas((prev) => prev.map((o) =>
      o.id === ofertaId
        ? { ...o, cvEnviadoId: cvId, cvEnviado: cvId, actualizadoEn: new Date().toISOString().slice(0, 10) }
        : o
    ));
    try {
      await dbLinkCVToOferta(ofertaId, cvId);
      // Recompute ofertasUsadas from updated offers state
      setOfertas((currentOfertas) => {
        const cvUsageCount: Record<string, number> = {};
        for (const o of currentOfertas) {
          const id = o.cvEnviadoId ?? o.cvEnviado;
          if (id) cvUsageCount[id] = (cvUsageCount[id] ?? 0) + 1;
        }
        setCvs((prevCvs) => {
          const next = { ...prevCvs };
          for (const id of Object.keys(next)) {
            next[id] = { ...next[id], ofertasUsadas: cvUsageCount[id] ?? 0 };
          }
          return next;
        });
        return currentOfertas;
      });
    } catch {
      // Revert on error
      const fresh = await fetchOfertas();
      setOfertas(fresh.map((o) => ({ ...o, contactos: ofertaContactos[o.id] ?? [] })));
      showToast('Error al vincular el CV', 'warn');
    }
  }, [ofertaContactos, showToast]);

  const updatePerfil = useCallback(async (data: Partial<PerfilUsuario>) => {
    await dbUpdatePerfil(data);
    setPerfil((prev) => prev ? { ...prev, ...data } : prev);
  }, []);

  const addExperiencia = useCallback(async (data: Omit<Experiencia, 'id'>) => {
    const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error('No autenticado');
    const exp = await dbAddExperiencia(data, userId);
    setExperiencia((prev) => [exp, ...prev]);
  }, [currentUser]);

  const updateExperiencia = useCallback(async (id: string, data: Partial<Experiencia>) => {
    setExperiencia((prev) => prev.map((e) => e.id === id ? { ...e, ...data } : e));
    try {
      await dbUpdateExperiencia(id, data);
    } catch {
      const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      if (userId) setExperiencia(await fetchExperiencia(userId));
    }
  }, [currentUser]);

  const deleteExperiencia = useCallback(async (id: string) => {
    setExperiencia((prev) => prev.filter((e) => e.id !== id));
    try {
      await dbDeleteExperiencia(id);
    } catch {
      const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      if (userId) setExperiencia(await fetchExperiencia(userId));
    }
  }, [currentUser]);

  const addEducacion = useCallback(async (data: Omit<Educacion, 'id'>) => {
    const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error('No autenticado');
    const edu = await dbAddEducacion(data, userId);
    setEducacion((prev) => [edu, ...prev]);
  }, [currentUser]);

  const updateEducacion = useCallback(async (id: string, data: Partial<Educacion>) => {
    setEducacion((prev) => prev.map((e) => e.id === id ? { ...e, ...data } : e));
    try {
      await dbUpdateEducacion(id, data);
    } catch {
      const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      if (userId) setEducacion(await fetchEducacion(userId));
    }
  }, [currentUser]);

  const deleteEducacion = useCallback(async (id: string) => {
    setEducacion((prev) => prev.filter((e) => e.id !== id));
    try {
      await dbDeleteEducacion(id);
    } catch {
      const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      if (userId) setEducacion(await fetchEducacion(userId));
    }
  }, [currentUser]);

  const updateAvatar = useCallback(async (file: File) => {
    const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error('No autenticado');
    const url = await dbUploadAvatar(file, userId);
    setPerfil((prev) => prev ? { ...prev, avatarUrl: url } : prev);
  }, [currentUser]);

  const fetchCasos = useCallback(async () => {
    const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;
    const data = await dbFetchCasos(userId);
    setCasos(data);
  }, [currentUser]);

  const addCaso = useCallback(async (data: Partial<Caso>) => {
    const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) throw new Error('No autenticado');
    const caso = await dbAddCaso(userId, data);
    setCasos((prev) => [caso, ...prev]);
  }, [currentUser]);

  const updateCaso = useCallback(async (id: string, data: Partial<Caso>) => {
    setCasos((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c));
    try {
      await dbUpdateCaso(id, data);
    } catch {
      const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      if (userId) setCasos(await dbFetchCasos(userId));
    }
  }, [currentUser]);

  const deleteCaso = useCallback(async (id: string) => {
    setCasos((prev) => prev.filter((c) => c.id !== id));
    try {
      await dbDeleteCaso(id);
    } catch {
      const userId = currentUser?.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      if (userId) setCasos(await dbFetchCasos(userId));
    }
  }, [currentUser]);

  const updateOfertaPasos = useCallback((ofertaId: string, pasos: PasoRoadmap[]) => {
    setOfertas((prev) => prev.map((o) =>
      o.id === ofertaId ? { ...o, pasos } : o
    ));
  }, []);

  const addOfertaContacto = useCallback(async (ofertaId: string, contactoId: string) => {
    // Optimistic update
    setOfertaContactos((prev) => {
      const existing = prev[ofertaId] ?? [];
      if (existing.includes(contactoId)) return prev;
      return { ...prev, [ofertaId]: [...existing, contactoId] };
    });
    setOfertas((prev) => prev.map((o) =>
      o.id === ofertaId && !o.contactos.includes(contactoId)
        ? { ...o, contactos: [...o.contactos, contactoId] }
        : o
    ));
    try {
      await dbAddOfertaContacto(ofertaId, contactoId);
    } catch {
      // Revert on error
      setOfertaContactos((prev) => ({
        ...prev,
        [ofertaId]: (prev[ofertaId] ?? []).filter((id) => id !== contactoId),
      }));
      setOfertas((prev) => prev.map((o) =>
        o.id === ofertaId ? { ...o, contactos: o.contactos.filter((id) => id !== contactoId) } : o
      ));
    }
  }, []);

  const removeOfertaContacto = useCallback(async (ofertaId: string, contactoId: string) => {
    // Optimistic update
    setOfertaContactos((prev) => ({
      ...prev,
      [ofertaId]: (prev[ofertaId] ?? []).filter((id) => id !== contactoId),
    }));
    setOfertas((prev) => prev.map((o) =>
      o.id === ofertaId ? { ...o, contactos: o.contactos.filter((id) => id !== contactoId) } : o
    ));
    try {
      await dbRemoveOfertaContacto(ofertaId, contactoId);
    } catch {
      // Revert on error
      setOfertaContactos((prev) => {
        const existing = prev[ofertaId] ?? [];
        if (existing.includes(contactoId)) return prev;
        return { ...prev, [ofertaId]: [...existing, contactoId] };
      });
      setOfertas((prev) => prev.map((o) =>
        o.id === ofertaId && !o.contactos.includes(contactoId)
          ? { ...o, contactos: [...o.contactos, contactoId] }
          : o
      ));
    }
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
    currentUser: User | null;
    linkCVToOferta: (ofertaId: string, cvId: string | null) => Promise<void>;
    refreshAll: () => Promise<void>;
    refreshing: boolean;
    setSidebarOpen: (v: boolean) => void;
    toggleSidebar: () => void;
  } = {
    page, ofertaId, ofertasView, dark, nuevaOpen, tweaks,
    ofertas, empresas, contactos, cvs, perfil, actividadLog, notas, roadmapPasos, ofertaContactos, plataformas,
    experiencia, educacion, casos,
    toasts, loading, error,
    setPage, setOfertasView, toggleDark, setNuevaOpen, setTweaks,
    moveOferta, addOferta, addEmpresa, updateEmpresa, deleteEmpresa,
    addContacto, updateContacto, deleteContacto,
    addPlataforma, updatePlataforma, deletePlataforma,
    addOfertaContacto, removeOfertaContacto,
    updateOfertaPasos,
    showToast, dismissToast,
    setNotas,
    addCV, removeCV,
    updatePerfil,
    addExperiencia, updateExperiencia, deleteExperiencia,
    addEducacion, updateEducacion, deleteEducacion,
    updateAvatar,
    fetchCasos, addCaso, updateCaso, deleteCaso,
    currentUser,
    linkCVToOferta,
    refreshAll,
    refreshing,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
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
      case 'plataformas': return <Plataformas />;
      case 'configuracion': return <Configuracion />;
      case 'casos': return <CasosPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
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
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {renderPage()}
            </div>
          </div>
        </div>
        <NuevaOfertaModal />
        <ToastContainer />
      </AppCtx.Provider>
    </ErrorBoundary>
  );
}

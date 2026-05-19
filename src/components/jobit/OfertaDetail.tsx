import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { useIsMobile } from './hooks';
import { scoringDimensions, estadoLabels, kanbanCols } from './data';
import type { PasoRoadmap, EstadoOferta, Contacto, AdjuntoItem, NotaItem } from './types';
import { updateOferta as dbUpdateOferta, deleteOferta as dbDeleteOferta, updateScoring, fetchAdjuntos, uploadAdjunto, deleteAdjunto, getAdjuntoUrl, addNota as dbAddNota, updateNota as dbUpdateNota, deleteNota as dbDeleteNota, getCVUrl } from '../../lib/db';
import { formatDate } from '../../lib/utils';

function LogoBubble({ empresa, size = 56 }: { empresa: string; size?: number }) {
  const { empresas } = useApp();
  const emp = empresas[empresa];
  if (!emp) return <div style={{ width: size, height: size, borderRadius: 12, background: 'var(--surface-muted)' }} />;
  return (
    <div
      className="detail-logo"
      style={{ width: size, height: size, background: emp.color, borderRadius: size * 0.21, fontSize: size * 0.28 }}
    >
      {emp.logo}
    </div>
  );
}

// ─── NotaPanel ───────────────────────────────────────────────────────────────

function NotaPanel({
  nota,
  notas,
  setNotas,
  showToast,
  onClose,
}: {
  nota: NotaItem;
  notas: NotaItem[];
  setNotas: (notas: NotaItem[]) => void;
  showToast: (message: string, variant: 'success' | 'warn' | 'info') => void;
  onClose: () => void;
}) {
  const [titulo, setTitulo] = useState(nota.titulo);
  const [contenido, setContenido] = useState(nota.contenido);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ titulo, contenido });
  latestRef.current = { titulo, contenido };

  const save = useCallback(async (t: string, c: string) => {
    try {
      await dbUpdateNota(nota.id, { titulo: t, contenido: c });
      setNotas(notas.map((n) => n.id === nota.id ? { ...n, titulo: t, contenido: c, actualizadoEn: new Date().toISOString() } : n));
    } catch {
      showToast('Error al guardar la nota', 'warn');
    }
  }, [nota.id, notas, setNotas, showToast]);

  // Debounced auto-save on change
  const scheduleAutoSave = (t: string, c: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void save(t, c);
    }, 800);
  };

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitulo(e.target.value);
    scheduleAutoSave(e.target.value, latestRef.current.contenido);
  };

  const handleContenidoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContenido(e.target.value);
    scheduleAutoSave(latestRef.current.titulo, e.target.value);
  };

  const handleClose = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void save(latestRef.current.titulo, latestRef.current.contenido);
    onClose();
  };

  // Escape key to save and close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const lastEditLabel = nota.actualizadoEn
    ? `Última edición: ${formatDate(nota.actualizadoEn)}`
    : '';

  return (
    <>
      {/* backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 299,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(1px)',
          animation: 'fadeIn 0.18s ease',
        }}
      />
      {/* panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 300,
          width: 480,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
          animation: 'slideInRight 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Nota
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: 12.5, height: 'auto', fontWeight: 600 }}
              onClick={handleClose}
            >
              Guardar
            </button>
            <button
              onClick={handleClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-subtle)', fontSize: 18, lineHeight: 1,
                padding: '2px 6px', borderRadius: 6,
              }}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* title input */}
        <div style={{ padding: '20px 24px 0' }}>
          <input
            value={titulo}
            onChange={handleTituloChange}
            placeholder="Título de la nota"
            autoFocus
            style={{
              width: '100%',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              background: 'none',
              border: 'none',
              outline: 'none',
              padding: 0,
              lineHeight: 1.3,
            }}
          />
        </div>

        {/* content textarea */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 24px 16px', overflow: 'hidden' }}>
          <textarea
            value={contenido}
            onChange={handleContenidoChange}
            placeholder="Escribe el contenido de la nota…"
            style={{
              flex: 1,
              width: '100%',
              fontSize: 15,
              color: 'var(--text)',
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.7,
              padding: 0,
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
              overflowY: 'auto',
            }}
          />
        </div>

        {/* footer */}
        {lastEditLabel && (
          <div style={{
            padding: '10px 24px 16px',
            fontSize: 11.5,
            color: 'var(--text-subtle)',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            {lastEditLabel}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

// ─── NotasInline ─────────────────────────────────────────────────────────────

function NotasInline({
  ofertaId,
  notas,
  setNotas,
  showToast,
}: {
  ofertaId: string;
  notas: NotaItem[];
  setNotas: (notas: NotaItem[]) => void;
  showToast: (message: string, variant: 'success' | 'warn' | 'info') => void;
}) {
  const ofertaNotas = notas.filter((n) => n.ofertaId === ofertaId);
  const [notaPanelId, setNotaPanelId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const panelNota = notaPanelId != null ? notas.find((n) => n.id === notaPanelId) ?? null : null;

  const handleAddNota = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await dbAddNota({ titulo: 'Nueva nota', contenido: '', ofertaId });
      setNotas([created, ...notas]);
      setNotaPanelId(created.id);
    } catch {
      showToast('Error al crear la nota', 'warn');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dbDeleteNota(id);
      setNotas(notas.filter((n) => n.id !== id));
      if (notaPanelId === id) setNotaPanelId(null);
    } catch {
      showToast('Error al eliminar la nota', 'warn');
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Notas</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {ofertaNotas.length > 0 && (
              <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{ofertaNotas.length}</span>
            )}
            <button
              className="btn btn-ghost"
              style={{ padding: '3px 8px', fontSize: 13, height: 'auto', fontWeight: 600 }}
              onClick={handleAddNota}
              disabled={creating}
              title="Nueva nota"
            >
              {creating ? '…' : '+'}
            </button>
          </div>
        </div>
        <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ofertaNotas.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', fontStyle: 'italic' }}>Sin notas aún</div>
          ) : (
            ofertaNotas.map((nota) => (
              <div
                key={nota.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--surface-raised)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
                  {/* Read-only title — clicking opens the panel */}
                  <span
                    onClick={() => setNotaPanelId(nota.id)}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title="Abrir nota"
                  >
                    {nota.titulo || 'Sin título'}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '2px 5px', height: 'auto', color: 'oklch(0.55 0.22 25)', flexShrink: 0 }}
                    title="Eliminar nota"
                    onClick={() => handleDelete(nota.id)}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>

                {/* Content preview — clicking opens the panel */}
                {nota.contenido && (
                  <div
                    onClick={() => setNotaPanelId(nota.id)}
                    style={{
                      padding: '0 10px 8px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      cursor: 'pointer',
                    }}
                  >
                    {nota.contenido}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {panelNota && (
        <NotaPanel
          nota={panelNota}
          notas={notas}
          setNotas={setNotas}
          showToast={showToast}
          onClose={() => setNotaPanelId(null)}
        />
      )}
    </>
  );
}

function DetallesTab({ ofertaId }: { ofertaId: string }) {
  const { ofertas, empresas, contactos, notas, setNotas, showToast, cvs } = useApp();
  const isMobile = useIsMobile();
  const oferta = ofertas.find((o) => o.id === ofertaId);
  if (!oferta) return null;
  const emp = empresas[oferta.empresa];
  const ofertaContactos = oferta.contactos.map((id) => contactos[id]).filter((c): c is NonNullable<typeof c> => c != null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20 }}>
      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Compensación */}
        <div className="card">
          <div className="card-header"><span className="card-title">Compensación</span></div>
          <div className="card-body">
            <div className="comp-grid">
              <div className="comp-cell">
                <div className="comp-cell-label">Bruto ofrecido</div>
                <div className="comp-cell-value">{oferta.moneda ? `${oferta.moneda} ` : ''}{oferta.salarioBrutoOfrecido?.toLocaleString() ?? '—'}</div>
                <div className="comp-cell-sub">por mes</div>
              </div>
              <div className="comp-cell">
                <div className="comp-cell-label">Neto estimado</div>
                <div className="comp-cell-value">{oferta.moneda ? `${oferta.moneda} ` : ''}{oferta.salarioNetoOfrecido?.toLocaleString() ?? '—'}</div>
                <div className="comp-cell-sub">por mes</div>
              </div>
              <div className="comp-cell">
                <div className="comp-cell-label">Mi pretensión</div>
                <div className="comp-cell-value">{oferta.moneda ? `${oferta.moneda} ` : ''}{oferta.pretension?.toLocaleString() ?? '—'}</div>
                <div className="comp-cell-sub">bruto/mes</div>
              </div>
              <div className="comp-cell" style={{
                background: oferta.pretension && oferta.salarioBrutoOfrecido
                  ? oferta.salarioBrutoOfrecido >= oferta.pretension
                    ? 'oklch(0.94 0.06 155)' : 'var(--color-danger-soft)'
                  : 'var(--surface-sunken)'
              }}>
                <div className="comp-cell-label">vs. pretensión</div>
                <div className="comp-cell-value" style={{
                  color: oferta.pretension && oferta.salarioBrutoOfrecido
                    ? oferta.salarioBrutoOfrecido >= oferta.pretension ? 'oklch(0.50 0.19 155)' : 'oklch(0.50 0.22 25)'
                    : 'var(--text)'
                }}>
                  {oferta.pretension && oferta.salarioBrutoOfrecido
                    ? `${oferta.salarioBrutoOfrecido >= oferta.pretension ? '+' : ''}${Math.round(((oferta.salarioBrutoOfrecido - oferta.pretension) / oferta.pretension) * 100)}%`
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="card">
          <div className="card-header"><span className="card-title">Descripción del puesto</span></div>
          <div className="card-body">
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{oferta.descripcionPuesto}</p>
            {oferta.beneficios.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Beneficios</div>
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {oferta.beneficios.map((b) => (
                    <li key={b} style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Stack */}
        <div className="card">
          <div className="card-header"><span className="card-title">Stack & contexto</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {oferta.tags.map((tag) => (
                <span key={tag} className="chip" style={{ fontSize: 13, padding: '4px 10px' }}>
                  <Icon name="code" size={12} />
                  {tag}
                </span>
              ))}
            </div>
            <dl className="info-grid" style={{ marginTop: 16 }}>
              <dt>Modalidad</dt><dd style={{ textTransform: 'capitalize' }}>{oferta.modalidad ?? '—'}</dd>
              <dt>Tipo empleo</dt><dd>{oferta.tipoEmpleo ?? '—'}</dd>
              {(oferta.jornada) && <><dt>Jornada</dt><dd>{oferta.jornada}</dd></>}
              {(oferta.ciudad || oferta.pais) && <><dt>Ubicación</dt><dd>{[oferta.ciudad, oferta.pais].filter(Boolean).join(', ')}</dd></>}
            </dl>
          </div>
        </div>
      </div>

      {/* Sidebar 320px */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Empresa */}
        {emp && (
          <div className="card">
            <div className="card-header"><span className="card-title">Empresa</span></div>
            <div className="card-body">
              <dl className="info-grid">
                <dt>Nombre</dt><dd>{emp.nombre}</dd>
                <dt>Rubro</dt><dd>{emp.rubro}</dd>
                <dt>Tamaño</dt><dd style={{ textTransform: 'capitalize' }}>{emp.tamaño}</dd>
                <dt>País</dt><dd>{emp.pais}</dd>
                {emp.glassdoor && <><dt>Glassdoor</dt><dd>⭐ {emp.glassdoor}</dd></>}
              </dl>
            </div>
          </div>
        )}

        {/* CV */}
        <div className="card">
          <div className="card-header"><span className="card-title">CV enviado</span></div>
          <div className="card-body" style={{ padding: 16 }}>
            {/* Quick inline CV selector */}
            <div style={{ marginBottom: oferta.cvEnviadoId ? 10 : 0 }}>
              <select
                className="form-input"
                value={oferta.cvEnviadoId ?? ''}
                onChange={async (e) => {
                  const val = e.target.value || null;
                  try {
                    await linkCVToOferta(oferta.id, val);
                    showToast(val ? 'CV vinculado' : 'CV desvinculado', 'success');
                  } catch {
                    showToast('Error al vincular el CV', 'warn');
                  }
                }}
                style={{ width: '100%' }}
              >
                <option value="">Sin CV</option>
                {Object.values(cvs).map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.nombre}{cv.version ? ` v${cv.version}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {oferta.cvEnviadoId && (() => {
              const cv = cvs[oferta.cvEnviadoId];
              const handleVerCV = async () => {
                if (!cv) return;
                try {
                  const url = await getCVUrl(cv.storagePath);
                  window.open(url, '_blank', 'noopener,noreferrer');
                } catch {
                  showToast('Error al obtener el CV', 'warn');
                }
              };
              return cv ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="file" size={16} stroke="oklch(0.52 0.20 250)" />
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>
                    {cv.nombre}{cv.version ? ` v${cv.version}` : ''}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '3px 8px', fontSize: 12 }}
                    onClick={handleVerCV}
                  >
                    <Icon name="link" size={12} stroke="oklch(0.52 0.20 250)" /> Ver
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Fecha de inicio */}
        {oferta.fechaInicio && (
          <div className="card" style={{ background: 'var(--color-brand-light)', border: '1px solid oklch(0.52 0.20 250 / 0.3)' }}>
            <div className="card-header" style={{ border: 'none', paddingBottom: 8 }}>
              <span className="card-title" style={{ color: 'oklch(0.42 0.22 250)' }}>Fecha de inicio</span>
            </div>
            <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="calendar" size={18} stroke="oklch(0.52 0.20 250)" />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'oklch(0.42 0.22 250)' }}>
                  {formatDate(oferta.fechaInicio)}
                </div>
                <div style={{ fontSize: 12, color: 'oklch(0.52 0.20 250 / 0.8)' }}>Fecha de inicio de la postulación</div>
              </div>
            </div>
          </div>
        )}

        {/* Contactos */}
        {ofertaContactos.length > 0 && (
          <div className="card">
            <div className="card-header"><span className="card-title">Contactos</span></div>
            <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ofertaContactos.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: c.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0
                  }}>{c.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.rol}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas inline */}
        <NotasInline ofertaId={ofertaId} notas={notas} setNotas={setNotas} showToast={showToast} />
      </div>
    </div>
  );
}

function RoadmapTab({ ofertaId }: { ofertaId: string }) {
  const { ofertas, contactos, showToast, updateOfertaPasos, ...rest } = useApp();
  const plataformas: Record<string, { id: string; nombre: string; logo?: string; color: string }> =
    (rest as Record<string, unknown>).plataformas as Record<string, { id: string; nombre: string; logo?: string; color: string }> ?? {};
  const oferta = ofertas.find((o) => o.id === ofertaId);
  const [pasos, setPasos] = useState<PasoRoadmap[]>(oferta?.pasos ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const newInputRef = useRef<HTMLInputElement | null>(null);

  const EMOJI_OPTIONS = ['📞', '📧', '💬', '🤝', '👥', '🎯', '📝', '✅', '❌', '⏳', '🔍', '💡', '📊', '🚀', '🏢', '💼', '🧪', '🎤', '📅', '💰'];

  useEffect(() => {
    if (oferta) setPasos(oferta.pasos ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oferta?.id]);

  const savePasos = async (updated: PasoRoadmap[]) => {
    setPasos(updated);
    updateOfertaPasos(ofertaId, updated);
    try {
      await dbUpdateOferta(ofertaId, { pasos: updated });
    } catch {
      showToast('Error al guardar los pasos', 'warn');
    }
  };

  const handleToggle = (id: string) => {
    savePasos(pasos.map((p) => {
      if (p.id !== id) return p;
      const next: PasoRoadmap['estado'] =
        p.estado === 'pendiente' ? 'completado' :
        p.estado === 'completado' ? 'finalizado' : 'pendiente';
      return { ...p, estado: next };
    }));
  };

  const handleDelete = (id: string) => {
    savePasos(pasos.filter((p) => p.id !== id));
  };

  const handleAddStep = () => {
    const newStep: PasoRoadmap = { id: crypto.randomUUID(), titulo: '', estado: 'pendiente' };
    setPasos((prev) => [...prev, newStep]);
    setEditingId(newStep.id);
    setEditTitulo('');
    setEditDescripcion('');
    setEditFecha('');
    setEditEmoji('');
    setShowEmojiPicker(false);
    setTimeout(() => newInputRef.current?.focus(), 0);
  };

  const handleEditOpen = (paso: PasoRoadmap) => {
    setEditingId(paso.id);
    setEditTitulo(paso.titulo);
    setEditDescripcion(paso.descripcion ?? '');
    setEditFecha(paso.fecha ?? '');
    setEditEmoji(paso.emoji ?? '');
    setShowEmojiPicker(false);
  };

  const handleEditSave = async (id: string) => {
    const titulo = editTitulo.trim();
    if (!titulo) {
      await savePasos(pasos.filter((p) => p.id !== id));
    } else {
      await savePasos(
        pasos.map((p) =>
          p.id === id
            ? { ...p, titulo, descripcion: editDescripcion.trim() || undefined, fecha: editFecha.trim() || undefined, emoji: editEmoji || undefined }
            : p
        )
      );
    }
    setEditingId(null);
    setShowEmojiPicker(false);
  };

  const handlePickerChange = (id: string, field: 'plataformaId' | 'contactoId', value: string) => {
    savePasos(pasos.map((p) => p.id === id ? { ...p, [field]: value || undefined } : p));
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') { e.preventDefault(); handleEditSave(id); }
    else if (e.key === 'Escape') {
      const paso = pasos.find((p) => p.id === id);
      if (paso && !paso.titulo) setPasos(pasos.filter((p) => p.id !== id));
      setEditingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {pasos.length === 0 && (
          <div style={{ color: 'var(--text-subtle)', fontSize: 13.5, padding: '16px 0', textAlign: 'center' }}>
            No hay pasos aún. ¡Agrega el primero!
          </div>
        )}
        {pasos.map((paso, i) => (
          <div key={paso.id} className="roadmap-step" style={{ position: 'relative' }}>
            <div className="roadmap-rail">
              <button
                onClick={() => handleToggle(paso.id)}
                style={{
                  width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                  borderColor: paso.estado === 'completado'
                    ? 'oklch(0.70 0.19 155)'
                    : paso.estado === 'finalizado'
                    ? 'oklch(0.55 0.22 25)'
                    : 'var(--border)',
                  background: paso.estado === 'completado'
                    ? 'oklch(0.70 0.19 155)'
                    : paso.estado === 'finalizado'
                    ? 'oklch(0.55 0.22 25)'
                    : 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, flexShrink: 0,
                }}
                title={
                  paso.estado === 'completado' ? 'Marcar como finalizado' :
                  paso.estado === 'finalizado' ? 'Marcar como pendiente' :
                  'Marcar como completado'
                }
              >
                {paso.estado === 'completado' && <Icon name="check" size={10} stroke="white" />}
                {paso.estado === 'finalizado' && <span style={{ fontSize: 10, color: 'white', lineHeight: 1, fontWeight: 700 }}>✕</span>}
              </button>
              {i < pasos.length - 1 && <div className="roadmap-connector" />}
            </div>
            <div style={{ flex: 1 }}>
              {editingId === paso.id ? (
                <div
                  className="roadmap-card"
                  onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) handleEditSave(paso.id); }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <input
                    ref={!paso.titulo ? newInputRef : undefined}
                    className="form-input"
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, paso.id)}
                    placeholder="Título del paso"
                    style={{ fontSize: 14, fontWeight: 600, width: '100%' }}
                    autoFocus
                  />
                  {/* Emoji picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setShowEmojiPicker((v) => !v); }}
                      style={{
                        fontSize: 18, lineHeight: 1, padding: '2px 6px', borderRadius: 6,
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        cursor: 'pointer', minWidth: 36, textAlign: 'center',
                      }}
                      title="Seleccionar emoji"
                    >
                      {editEmoji || '＋'}
                    </button>
                    {editEmoji && (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setEditEmoji(''); setShowEmojiPicker(false); }}
                        style={{
                          fontSize: 11, padding: '2px 6px', borderRadius: 6,
                          border: '1px solid var(--border)', background: 'var(--surface)',
                          cursor: 'pointer', color: 'var(--text-subtle)',
                        }}
                        title="Quitar emoji"
                      >
                        ✕
                      </button>
                    )}
                    <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>Ícono del paso</span>
                  </div>
                  {showEmojiPicker && (
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
                      padding: 8, background: 'var(--surface-raised)',
                      border: '1px solid var(--border)', borderRadius: 8,
                    }}>
                      {EMOJI_OPTIONS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setEditEmoji(em); setShowEmojiPicker(false); }}
                          style={{
                            fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6,
                            border: editEmoji === em ? '2px solid oklch(0.52 0.20 250)' : '2px solid transparent',
                            background: editEmoji === em ? 'oklch(0.52 0.20 250 / 0.1)' : 'transparent',
                            cursor: 'pointer',
                          }}
                          title={em}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    className="form-input"
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, paso.id)}
                    placeholder="Descripción (opcional)"
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  <input
                    className="form-input"
                    type="date"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, paso.id)}
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select
                      className="form-input"
                      value={paso.plataformaId ?? ''}
                      onChange={(e) => handlePickerChange(paso.id, 'plataformaId', e.target.value)}
                      style={{ fontSize: 12, padding: '3px 8px', height: 'auto', minWidth: 120, maxWidth: 180, color: paso.plataformaId ? 'var(--text)' : 'var(--text-subtle)' }}
                      title="Plataforma"
                    >
                      <option value="">Sin plataforma</option>
                      {Object.values(plataformas).map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <select
                      className="form-input"
                      value={paso.contactoId ?? ''}
                      onChange={(e) => handlePickerChange(paso.id, 'contactoId', e.target.value)}
                      style={{ fontSize: 12, padding: '3px 8px', height: 'auto', minWidth: 120, maxWidth: 200, color: paso.contactoId ? 'var(--text)' : 'var(--text-subtle)' }}
                      title="Contacto"
                    >
                      <option value="">Sin contacto</option>
                      {Object.values(contactos).filter((c): c is NonNullable<typeof c> => c != null).map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (!paso.titulo) setPasos(pasos.filter((p) => p.id !== paso.id));
                        setEditingId(null);
                      }}
                      style={{ fontSize: 12 }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-primary"
                      onMouseDown={(e) => { e.preventDefault(); handleEditSave(paso.id); }}
                      style={{ fontSize: 12 }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="roadmap-card" style={{ opacity: paso.estado !== 'pendiente' ? 0.65 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    {/* Emoji */}
                    {paso.emoji && (
                      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{paso.emoji}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14, fontWeight: 600,
                          color: paso.estado === 'pendiente' ? 'var(--text)' : 'var(--text-muted)',
                          textDecoration: paso.estado !== 'pendiente' ? 'line-through' : 'none',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleEditOpen(paso)}
                        title="Editar paso"
                      >
                        {paso.titulo || <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Sin título</span>}
                      </div>
                      {paso.descripcion && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '4px 0 0' }}>
                          {paso.descripcion}
                        </p>
                      )}
                      {paso.fecha && (
                        <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: 4 }}>
                          {formatDate(paso.fecha)}
                        </span>
                      )}
                      {/* Platform badge + contact initials in view mode */}
                      {(paso.plataformaId || paso.contactoId) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                          {paso.plataformaId && plataformas[paso.plataformaId] && (() => {
                            const plat = plataformas[paso.plataformaId!];
                            return (
                              <span
                                title={plat.nombre}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  height: 20, minWidth: 28, padding: '0 5px',
                                  borderRadius: 4,
                                  background: plat.color ?? 'var(--surface-muted)',
                                  color: 'white',
                                  fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                                  letterSpacing: '0.03em', flexShrink: 0,
                                }}
                              >
                                {plat.logo ?? plat.nombre.slice(0, 2).toUpperCase()}
                              </span>
                            );
                          })()}
                          {paso.contactoId && contactos[paso.contactoId] && (() => {
                            const ct = contactos[paso.contactoId!]!;
                            const parts = ct.nombre.trim().split(/\s+/);
                            const initials = parts.length >= 2
                              ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                              : ct.nombre.slice(0, 2).toUpperCase();
                            return (
                              <span
                                title={ct.nombre}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: 20, height: 20, borderRadius: '50%',
                                  background: ct.color,
                                  color: 'white',
                                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                                }}
                              >
                                {initials}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleEditOpen(paso)}
                        style={{ padding: '4px 6px' }}
                        title="Editar paso"
                      >
                        <Icon name="edit" size={13} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleDelete(paso.id)}
                        style={{ padding: '4px 6px', color: 'oklch(0.55 0.22 25)' }}
                        title="Eliminar paso"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-secondary" onClick={handleAddStep}>
          <Icon name="plus" size={14} /> Agregar paso
        </button>
      </div>
    </div>
  );
}

function ScoringTab({ ofertaId }: { ofertaId: string }) {
  const { showToast } = useApp();
  const isMobile = useIsMobile();
  // null means "no rating" (Sin calificar); undefined key also treated as null
  const [scores, setScores] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(scoringDimensions.map((d) => [d.key, null]))
  );
  const [highlightRow, setHighlightRow] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePip = async (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
    setHighlightRow(key);
    setSaving(true);
    try {
      await updateScoring(ofertaId, key, value);
    } catch {
      showToast('Error al guardar el scoring', 'warn');
    } finally {
      setSaving(false);
      setHighlightRow(null);
    }
  };

  const handleClear = async (key: string) => {
    setScores((prev) => ({ ...prev, [key]: null }));
    setHighlightRow(key);
    setSaving(true);
    try {
      await updateScoring(ofertaId, key, null);
    } catch {
      showToast('Error al guardar el scoring', 'warn');
    } finally {
      setSaving(false);
      setHighlightRow(null);
    }
  };

  // Only rated dimensions contribute to the total
  const ratedEntries = Object.entries(scores).filter(([, v]) => v !== null) as [string, number][];
  const total = ratedEntries.length > 0
    ? Math.round(ratedEntries.reduce((sum, [, v]) => sum + v, 0) / ratedEntries.length * 20)
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Dimensiones</span>
          {saving && (
            <span className="autosave-indicator">
              <Icon name="check" size={12} stroke="oklch(0.70 0.19 155)" />
              Guardando…
            </span>
          )}
        </div>
        <div style={{ padding: '8px 0' }}>
          {scoringDimensions.map((dim) => {
            const score = scores[dim.key] ?? null;
            const isNull = score === null;
            return (
              <div key={dim.key} className={`scoring-row${highlightRow === dim.key ? ' highlight' : ''}`}>
                <span className="scoring-label">{dim.label}</span>
                <div className="scoring-pips">
                  {[1, 2, 3, 4, 5].map((pip) => (
                    <button
                      key={pip}
                      className={`pip${!isNull && score >= pip ? ' active' : ''}`}
                      onClick={() => handlePip(dim.key, pip)}
                      title={`${pip}/5`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleClear(dim.key)}
                  title="Sin calificar"
                  style={{
                    marginLeft: 6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `1.5px solid ${isNull ? 'oklch(0.52 0.20 250)' : 'var(--border)'}`,
                    background: isNull ? 'oklch(0.52 0.20 250 / 0.12)' : 'transparent',
                    color: isNull ? 'oklch(0.52 0.20 250)' : 'var(--text-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: isNull ? 'var(--text-subtle)' : 'var(--text-subtle)', width: 60, textAlign: 'right' }}>
                  {isNull ? 'Sin calif.' : `${score}/5`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Score total
          </div>
          <div style={{
            fontSize: 60, fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: ratedEntries.length === 0 ? 'var(--text-subtle)' : total >= 80 ? 'oklch(0.70 0.19 155)' : total >= 60 ? 'oklch(0.52 0.20 250)' : 'oklch(0.58 0.22 25)',
            lineHeight: 1
          }}>
            {ratedEntries.length === 0 ? '—' : total}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 6 }}>
            {ratedEntries.length === 0 ? 'Sin calificar' : `/100 · ${ratedEntries.length}/${scoringDimensions.length} dims.`}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkles" size={14} stroke="oklch(0.52 0.20 250)" />
            Insight
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {ratedEntries.length === 0
              ? 'Califica las dimensiones para ver un insight sobre este rol.'
              : total >= 80
              ? 'Excelente match. El stack técnico y la compensación están por encima de tu pretensión.'
              : total >= 60
              ? 'Buen fit. Considera negociar salario y verificar work-life balance.'
              : 'Fit moderado. Evalúa si vale la pena continuar el proceso.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactosTab({ ofertaId }: { ofertaId: string }) {
  const { ofertas, contactos, empresas, addOfertaContacto, removeOfertaContacto, showToast } = useApp();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [linking, setLinking] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const oferta = ofertas.find((o) => o.id === ofertaId);
  if (!oferta) return null;

  // Contacts explicitly linked via junction table
  const linkedIds = new Set(oferta.contactos);

  // Contacts linked to this offer's empresa (by empresa field on Contacto)
  const empresaContactos = Object.values(contactos).filter(
    (c): c is Contacto => c.empresa === oferta.empresa,
  );

  // Linked contacts (from junction), resolved to Contacto objects
  const linkedContactos = oferta.contactos
    .map((id) => contactos[id])
    .filter((c): c is Contacto => c != null);

  // Empresa contacts not already linked via junction
  const empresaOnlyContactos = empresaContactos.filter((c) => !linkedIds.has(c.id));

  // Combined display: linked first, then empresa-only
  const displayContactos = [...linkedContactos, ...empresaOnlyContactos];

  // Contacts not yet linked, for the picker
  const pickerContactos = Object.values(contactos).filter(
    (c): c is Contacto => !linkedIds.has(c.id),
  );
  const filteredPicker = pickerSearch.trim()
    ? pickerContactos.filter(
        (c) =>
          c.nombre.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          c.rol.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          (empresas[c.empresa]?.nombre ?? '').toLowerCase().includes(pickerSearch.toLowerCase()),
      )
    : pickerContactos;

  const handleLink = async (contactoId: string) => {
    setLinking(contactoId);
    try {
      await addOfertaContacto(ofertaId, contactoId);
      showToast('Contacto vinculado', 'success');
      setShowPicker(false);
      setPickerSearch('');
    } catch {
      showToast('Error al vincular contacto', 'warn');
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (contactoId: string) => {
    setLinking(contactoId);
    try {
      await removeOfertaContacto(ofertaId, contactoId);
      showToast('Contacto desvinculado', 'success');
    } catch {
      showToast('Error al desvincular contacto', 'warn');
    } finally {
      setLinking(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
          {displayContactos.length === 0
            ? 'No hay contactos para esta empresa.'
            : `${displayContactos.length} contacto${displayContactos.length !== 1 ? 's' : ''}`}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowPicker((v) => !v);
              setPickerSearch('');
            }}
          >
            <Icon name="plus" size={14} /> Vincular contacto
          </button>

          {/* Contact picker dropdown */}
          {showPicker && (
            <div
              ref={pickerRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-elevated)',
                zIndex: 100,
                width: 320,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <input
                  className="form-input"
                  placeholder="Buscar contacto…"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  autoFocus
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filteredPicker.length === 0 ? (
                  <div
                    style={{
                      padding: '16px 14px',
                      fontSize: 13,
                      color: 'var(--text-subtle)',
                      textAlign: 'center',
                    }}
                  >
                    No hay contactos disponibles
                  </div>
                ) : (
                  filteredPicker.map((c) => (
                    <button
                      key={c.id}
                      disabled={linking === c.id}
                      onClick={() => handleLink(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '9px 12px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: c.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {c.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {c.nombre}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {c.rol}
                          {c.empresa && empresas[c.empresa] ? ` · ${empresas[c.empresa].nombre}` : ''}
                        </div>
                      </div>
                      {linking === c.id ? (
                        <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>…</span>
                      ) : (
                        <Icon name="plus" size={14} stroke="oklch(0.52 0.20 250)" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact cards */}
      {displayContactos.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 13.5, color: 'var(--text-subtle)', marginBottom: 6 }}>
            No hay contactos para esta empresa.
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Agregá uno desde la sección Contactos o vinculá uno existente con el botón de arriba.
          </div>
        </div>
      ) : (
        displayContactos.map((c) => {
          const isLinked = linkedIds.has(c.id);
          return (
            <div
              key={c.id}
              className="card"
              style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.avatar}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {c.nombre}
                  </div>
                  {isLinked && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: 'oklch(0.94 0.06 250)',
                        color: 'oklch(0.42 0.22 250)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Vinculado
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {c.rol}
                  {c.empresa && empresas[c.empresa] ? ` · ${empresas[c.empresa].nombre}` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12.5,
                        color: 'oklch(0.52 0.20 250)',
                        textDecoration: 'none',
                      }}
                    >
                      <Icon name="mail" size={13} stroke="oklch(0.52 0.20 250)" /> {c.email}
                    </a>
                  )}
                  {c.linkedin && (
                    <a
                      href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12.5,
                        color: 'oklch(0.52 0.20 250)',
                        textDecoration: 'none',
                      }}
                    >
                      <Icon name="link" size={13} stroke="oklch(0.52 0.20 250)" /> LinkedIn
                    </a>
                  )}
                  {c.telefono && (
                    <a
                      href={`tel:${c.telefono}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12.5,
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                      }}
                    >
                      <Icon name="phone" size={13} stroke="var(--text-muted)" /> {c.telefono}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {isLinked ? (
                  <button
                    className="btn btn-ghost"
                    disabled={linking === c.id}
                    onClick={() => handleUnlink(c.id)}
                    title="Desvincular contacto"
                    style={{ fontSize: 12, padding: '4px 10px', color: 'var(--text-subtle)' }}
                  >
                    {linking === c.id ? '…' : 'Desvincular'}
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost"
                    disabled={linking === c.id}
                    onClick={() => handleLink(c.id)}
                    title="Vincular contacto a esta oferta"
                    style={{ fontSize: 12, padding: '4px 10px', color: 'oklch(0.52 0.20 250)' }}
                  >
                    {linking === c.id ? '…' : 'Vincular'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function fileIcon(tipo: string): string {
  if (tipo === 'application/pdf') return '📄';
  if (tipo.startsWith('image/')) return '🖼️';
  if (tipo === 'text/plain') return '📝';
  return '📎';
}

function AdjuntosTab({ ofertaId }: { ofertaId: string }) {
  const { currentUser, showToast } = useApp();
  const [adjuntos, setAdjuntos] = useState<AdjuntoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAdjuntos(ofertaId).then(setAdjuntos).catch(() => setAdjuntos([]));
  }, [ofertaId]);

  const handleFiles = async (files: FileList | File[]) => {
    if (!currentUser) { showToast('Debes iniciar sesión para subir archivos', 'warn'); return; }
    const fileArray = Array.from(files);
    const invalid = fileArray.filter((f) => !ACCEPTED_TYPES.includes(f.type));
    const tooLarge = fileArray.filter((f) => f.size > MAX_SIZE_BYTES);
    if (invalid.length > 0) {
      showToast(`Tipo de archivo no permitido: ${invalid.map((f) => f.name).join(', ')}`, 'warn');
      return;
    }
    if (tooLarge.length > 0) {
      showToast(`Archivo demasiado grande (máx. 10 MB): ${tooLarge.map((f) => f.name).join(', ')}`, 'warn');
      return;
    }
    setUploading(true);
    try {
      const results: AdjuntoItem[] = [];
      for (const file of fileArray) {
        const adjunto = await uploadAdjunto(file, ofertaId, currentUser.id);
        results.push(adjunto);
      }
      setAdjuntos((prev) => [...results, ...prev]);
      showToast(`${results.length} archivo${results.length !== 1 ? 's' : ''} subido${results.length !== 1 ? 's' : ''} correctamente`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al subir el archivo', 'warn');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (adjunto: AdjuntoItem) => {
    try {
      await deleteAdjunto(adjunto.id, adjunto.storagePath);
      setAdjuntos((prev) => prev.filter((a) => a.id !== adjunto.id));
      showToast('Adjunto eliminado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar el adjunto', 'warn');
    }
  };

  const handleDownload = async (adjunto: AdjuntoItem) => {
    try {
      const url = await getAdjuntoUrl(adjunto.storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al obtener el archivo', 'warn');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: dragOver ? '2px dashed oklch(0.52 0.20 250)' : '2px dashed transparent',
        borderRadius: 12,
        transition: 'border-color 0.15s',
        padding: dragOver ? 6 : 0,
      }}
    >
      {/* File list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {adjuntos.length === 0 && !uploading && (
          <div style={{
            color: 'var(--text-subtle)', textAlign: 'center', padding: '32px 20px',
            border: '1px dashed var(--border)', borderRadius: 10, fontSize: 13.5,
          }}>
            No hay adjuntos para esta oferta.<br />
            <span style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              Arrastrá archivos aquí o usá el botón de abajo (máx. 10 MB · PDF, imágenes, TXT)
            </span>
          </div>
        )}
        {adjuntos.map((adjunto) => (
          <div
            key={adjunto.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{fileIcon(adjunto.tipo)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adjunto.nombre}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 2 }}>
                {adjunto.sizeKb} KB
              </div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => handleDownload(adjunto)}
              title="Ver / descargar"
              style={{ padding: '5px 8px', flexShrink: 0 }}
            >
              <Icon name="link" size={14} stroke="oklch(0.52 0.20 250)" />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => handleDelete(adjunto)}
              title="Eliminar adjunto"
              style={{ padding: '5px 8px', color: 'oklch(0.55 0.22 25)', flexShrink: 0 }}
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
        {uploading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 10,
            color: 'var(--text-subtle)', fontSize: 13,
          }}>
            <span style={{ fontSize: 18 }}>⏳</span> Subiendo archivo…
          </div>
        )}
      </div>

      {/* Upload button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,.pdf"
            multiple
            style={{ display: 'none' }}
            onChange={handleInputChange}
            disabled={uploading}
          />
          <span className={`btn btn-secondary${uploading ? ' disabled' : ''}`} style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
            <Icon name="paperclip" size={14} /> {uploading ? 'Subiendo…' : 'Subir adjunto'}
          </span>
        </label>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          PDF, imágenes, TXT · máx. 10 MB · o arrastrá aquí
        </span>
      </div>
    </div>
  );
}

export function OfertaDetail() {
  const { ofertaId, ofertas, empresas, setPage, showToast, moveOferta, cvs, linkCVToOferta } = useApp();
  const isMobile = useIsMobile();
  const oferta = ofertas.find((o) => o.id === ofertaId);
  const [tab, setTab] = useState<'detalles' | 'roadmap' | 'contactos' | 'adjuntos' | 'scoring'>('detalles');
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);

  // Fix 1: Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<{
    titulo: string;
    empresa: string;
    estado: string;
    url: string;
    pretension: string;
    notas: string;
    modalidad: string;
    tipoEmpleo: string;
    jornada: string;
    pais: string;
    ciudad: string;
    moneda: string;
    salarioBruto: string;
    salarioNeto: string;
    metodoPago: string;
    cvEnviadoId: string;
  }>({ titulo: '', empresa: '', estado: '', url: '', pretension: '', notas: '', modalidad: '', tipoEmpleo: '', jornada: '', pais: '', ciudad: '', moneda: '', salarioBruto: '', salarioNeto: '', metodoPago: '', cvEnviadoId: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Fix 2: Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!oferta) {
    return (
      <div className="page-content">
        <button className="back-btn" onClick={() => setPage('ofertas')}>
          <Icon name="chevronLeft" size={16} /> Volver
        </button>
        <p>Oferta no encontrada</p>
      </div>
    );
  }

  const emp = empresas[oferta.empresa];
  const tabs = [
    { id: 'detalles', label: 'Detalles' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'contactos', label: 'Contactos' },
    { id: 'adjuntos', label: 'Adjuntos' },
    { id: 'scoring', label: 'Scoring' },
  ] as const;

  const handleEditOpen = () => {
    setEditFields({
      titulo: oferta.titulo,
      empresa: oferta.empresa,
      estado: oferta.estado,
      url: oferta.url ?? '',
      pretension: oferta.pretension != null ? String(oferta.pretension) : '',
      notas: '',
      modalidad: oferta.modalidad ?? '',
      tipoEmpleo: oferta.tipoEmpleo ?? '',
      jornada: oferta.jornada ?? '',
      pais: oferta.pais ?? '',
      ciudad: oferta.ciudad ?? '',
      moneda: oferta.moneda ?? '',
      salarioBruto: oferta.salarioBrutoOfrecido != null ? String(oferta.salarioBrutoOfrecido) : '',
      salarioNeto: oferta.salarioNetoOfrecido != null ? String(oferta.salarioNetoOfrecido) : '',
      metodoPago: oferta.metodoPago ?? '',
      cvEnviadoId: oferta.cvEnviadoId ?? oferta.cvEnviado ?? '',
    });
    setEditMode(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const patch: Parameters<typeof dbUpdateOferta>[1] = {
        titulo: editFields.titulo,
        empresa: editFields.empresa,
        estado: editFields.estado as EstadoOferta,
        url: editFields.url || undefined,
        pretension: editFields.pretension ? Math.round(Number(editFields.pretension)) : undefined,
        modalidad: (editFields.modalidad as Parameters<typeof dbUpdateOferta>[1]['modalidad']) || null,
        tipoEmpleo: (editFields.tipoEmpleo as Parameters<typeof dbUpdateOferta>[1]['tipoEmpleo']) || null,
        jornada: editFields.jornada.trim() || null,
        pais: editFields.pais.trim() || null,
        ciudad: editFields.ciudad.trim() || null,
        moneda: (editFields.moneda as Parameters<typeof dbUpdateOferta>[1]['moneda']) || null,
        salarioBrutoOfrecido: editFields.salarioBruto ? Math.round(Number(editFields.salarioBruto)) : null,
        salarioNetoOfrecido: editFields.salarioNeto ? Math.round(Number(editFields.salarioNeto)) : null,
        metodoPago: (editFields.metodoPago as Parameters<typeof dbUpdateOferta>[1]['metodoPago']) || null,
        cvEnviadoId: editFields.cvEnviadoId || null,
      };
      await dbUpdateOferta(oferta.id, patch);
      // Optimistic local state update via store action (handles cvEnviadoId + ofertasUsadas)
      const newCvId = editFields.cvEnviadoId || null;
      if (newCvId !== (oferta.cvEnviadoId ?? null)) {
        await linkCVToOferta(oferta.id, newCvId);
      }
      showToast('Oferta actualizada', 'success');
      setEditMode(false);
    } catch {
      showToast('Error al guardar los cambios', 'warn');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await dbDeleteOferta(oferta.id);
      showToast('Oferta eliminada', 'success');
      setPage('ofertas');
    } catch {
      showToast('Error al eliminar la oferta', 'warn');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="page-content">
      <button className="back-btn" onClick={() => setPage('ofertas')}>
        <Icon name="chevronLeft" size={16} /> Mis ofertas
      </button>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
            borderRadius: 14, padding: 28, maxWidth: 400, width: '100%',
            boxShadow: 'var(--shadow-elevated)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              ¿Eliminar esta oferta?
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 20 }}>
              Esta acción no se puede deshacer. La oferta "{oferta.titulo}" será eliminada permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit mode inline form */}
      {editMode ? (
        <div className="card" style={{ marginBottom: 20, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>Editar oferta</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Título</label>
              <input
                className="form-input"
                value={editFields.titulo}
                onChange={(e) => setEditFields((f) => ({ ...f, titulo: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Empresa</label>
              <select
                className="form-input"
                value={editFields.empresa}
                onChange={(e) => setEditFields((f) => ({ ...f, empresa: e.target.value }))}
                style={{ width: '100%' }}
              >
                <option value="">Sin empresa</option>
                {Object.values(empresas).map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Estado</label>
              <select
                className="form-input"
                value={editFields.estado}
                onChange={(e) => setEditFields((f) => ({ ...f, estado: e.target.value }))}
                style={{ width: '100%' }}
              >
                {kanbanCols.map((col) => (
                  <option key={col} value={col}>{estadoLabels[col]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>URL oferta</label>
              <input
                className="form-input"
                value={editFields.url}
                onChange={(e) => setEditFields((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Notas</label>
              <textarea
                className="form-input"
                value={editFields.notas}
                onChange={(e) => setEditFields((f) => ({ ...f, notas: e.target.value }))}
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Salario (opcional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Moneda</label>
                <select
                  className="form-input"
                  value={editFields.moneda}
                  onChange={(e) => setEditFields((f) => ({ ...f, moneda: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Sin especificar</option>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="UYU">UYU</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Método de pago</label>
                <select
                  className="form-input"
                  value={editFields.metodoPago}
                  onChange={(e) => setEditFields((f) => ({ ...f, metodoPago: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Sin especificar</option>
                  <option value="mensual">Mensual</option>
                  <option value="por_hora">Por hora</option>
                  <option value="por_proyecto">Por proyecto</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Salario bruto ofrecido</label>
                <input
                  className="form-input"
                  type="number"
                  value={editFields.salarioBruto}
                  onChange={(e) => setEditFields((f) => ({ ...f, salarioBruto: e.target.value }))}
                  placeholder="Ej: 3000"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Salario neto estimado</label>
                <input
                  className="form-input"
                  type="number"
                  value={editFields.salarioNeto}
                  onChange={(e) => setEditFields((f) => ({ ...f, salarioNeto: e.target.value }))}
                  placeholder="Ej: 2400"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Mi pretensión</label>
                <input
                  className="form-input"
                  type="number"
                  value={editFields.pretension}
                  onChange={(e) => setEditFields((f) => ({ ...f, pretension: e.target.value }))}
                  placeholder="Mi expectativa salarial para esta oferta"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              CV enviado
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>CV enviado con esta oferta</label>
                <select
                  className="form-input"
                  value={editFields.cvEnviadoId}
                  onChange={(e) => setEditFields((f) => ({ ...f, cvEnviadoId: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Sin CV</option>
                  {Object.values(cvs).map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.nombre}{cv.version ? ` (${cv.version})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Más información (opcional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Modalidad</label>
                <select
                  className="form-input"
                  value={editFields.modalidad}
                  onChange={(e) => setEditFields((f) => ({ ...f, modalidad: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Sin especificar</option>
                  <option value="remoto">Remoto</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Tipo de empleo</label>
                <select
                  className="form-input"
                  value={editFields.tipoEmpleo}
                  onChange={(e) => setEditFields((f) => ({ ...f, tipoEmpleo: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Sin especificar</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contrato">Contrato</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Jornada</label>
                <input
                  className="form-input"
                  value={editFields.jornada}
                  onChange={(e) => setEditFields((f) => ({ ...f, jornada: e.target.value }))}
                  placeholder="Ej: Lunes a viernes 9-18hs"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>País</label>
                <input
                  className="form-input"
                  value={editFields.pais}
                  onChange={(e) => setEditFields((f) => ({ ...f, pais: e.target.value }))}
                  placeholder="Ej: Argentina"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Ciudad</label>
                <input
                  className="form-input"
                  value={editFields.ciudad}
                  onChange={(e) => setEditFields((f) => ({ ...f, ciudad: e.target.value }))}
                  placeholder="Ej: Buenos Aires"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setEditMode(false)}
              disabled={editSaving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditSave}
              disabled={editSaving}
            >
              {editSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="detail-header">
            <LogoBubble empresa={oferta.empresa} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 className="detail-title">{oferta.titulo}</h1>
                <span className={`badge badge-${oferta.estado}`}>{estadoLabels[oferta.estado]}</span>
              </div>
              <div className="detail-lead">
                <span>{emp?.nombre ?? oferta.empresa}</span>
                {oferta.modalidad && <><span className="lead-sep">·</span>
                <span style={{ textTransform: 'capitalize' }}>{oferta.modalidad}</span></>}
                {(oferta.ciudad || oferta.pais) && <><span className="lead-sep">·</span>
                <span>{[oferta.ciudad, oferta.pais].filter(Boolean).join(', ')}</span></>}
                {oferta.salarioBrutoOfrecido && <>
                  <span className="lead-sep">·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
                    {oferta.moneda ? `${oferta.moneda} ` : ''}{oferta.salarioBrutoOfrecido.toLocaleString()}/mes
                  </span>
                </>}
                {oferta.url && <>
                  <span className="lead-sep">·</span>
                  <a href={oferta.url} target="_blank" rel="noreferrer" style={{ color: 'oklch(0.52 0.20 250)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="link" size={12} stroke="oklch(0.52 0.20 250)" /> Ver oferta
                  </a>
                </>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {oferta.tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-ghost" onClick={handleEditOpen}>
                <Icon name="edit" size={14} /> Editar
              </button>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary" onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}>
                  Cambiar estado <Icon name="chevronDown" size={14} />
                </button>
                {showEstadoDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 4,
                    background: 'var(--surface-raised)', border: '1px solid var(--border)',
                    borderRadius: 10, boxShadow: 'var(--shadow-elevated)', zIndex: 100,
                    minWidth: 180, overflow: 'hidden'
                  }}>
                    {kanbanCols.map((col) => (
                      <button
                        key={col}
                        style={{
                          display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left',
                          background: col === oferta.estado ? 'var(--surface-sunken)' : 'none',
                          border: 'none', cursor: 'pointer', fontSize: 13.5, color: 'var(--text)',
                          borderBottom: '1px solid var(--border)',
                        }}
                        onClick={() => {
                          moveOferta(oferta.id, col);
                          setShowEstadoDropdown(false);
                          showToast(`Estado cambiado a ${estadoLabels[col]}`, 'success');
                        }}
                      >
                        {estadoLabels[col]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'detalles' && <DetallesTab ofertaId={oferta.id} />}
      {tab === 'roadmap' && <RoadmapTab ofertaId={oferta.id} />}
      {tab === 'contactos' && <ContactosTab ofertaId={oferta.id} />}
      {tab === 'adjuntos' && <AdjuntosTab ofertaId={oferta.id} />}
      {tab === 'scoring' && <ScoringTab ofertaId={oferta.id} />}
    </div>
  );
}

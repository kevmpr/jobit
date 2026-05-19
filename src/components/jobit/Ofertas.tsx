import { useState } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { kanbanCols, estadoLabels } from './data';
import type { Oferta, EstadoOferta } from './types';
import { formatDate } from '../../lib/utils';
import { useIsMobile } from './hooks';

// ─── helpers ────────────────────────────────────────────────────────────────

const MODALIDAD_ICONS: Record<string, string> = {
  remoto: '🏠',
  presencial: '🏢',
  hibrido: '🔀',
};

const MODALIDAD_LABELS: Record<string, string> = {
  remoto: 'Remoto',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
};

function formatSalario(moneda: string | null, monto: number | null): string | null {
  if (!monto) return null;
  return moneda ? `${moneda} ${monto.toLocaleString('es-AR')}` : monto.toLocaleString('es-AR');
}

function scoringAverage(scoring: number | null | undefined): number | null {
  if (scoring == null) return null;
  return scoring;
}

function LogoBubble({ empresa, size = 32 }: { empresa: string; size?: number }) {
  const { empresas } = useApp();
  const emp = empresas[empresa];
  if (!emp) return <div style={{ width: size, height: size, borderRadius: 8, background: 'var(--surface-muted)' }} />;
  return (
    <div
      className="logo-bubble"
      style={{ width: size, height: size, background: emp.color, borderRadius: size * 0.25, fontSize: size * 0.33 }}
    >
      {emp.logo}
    </div>
  );
}

function OfertaCard({ oferta, onClick }: { oferta: Oferta; onClick: () => void }) {
  const { empresas, cvs } = useApp();
  const cvLinkedCard = oferta.cvEnviadoId ? (cvs[oferta.cvEnviadoId] ?? null) : null;
  const totalPasos = oferta.pasos?.length ?? 0;
  const completados = oferta.pasos?.filter(p => p.estado === 'completado').length ?? 0;
  const pct = totalPasos > 0 ? (completados / totalPasos) * 100 : 0;
  return (
    <div className="card" style={{ padding: 16, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-elevated)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <LogoBubble empresa={oferta.empresa} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oferta.titulo}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{empresas[oferta.empresa]?.nombre ?? oferta.empresa}</div>
        </div>
        <span className={`badge badge-${oferta.estado}`} style={{ flexShrink: 0, fontSize: 11 }}>{estadoLabels[oferta.estado]}</span>
      </div>

      {oferta.salarioBrutoOfrecido && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
          {oferta.moneda ? `${oferta.moneda} ` : ''}{oferta.salarioBrutoOfrecido.toLocaleString()}/mes
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {oferta.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="chip">{tag}</span>
        ))}
        {oferta.tags.length > 3 && <span className="chip">+{oferta.tags.length - 3}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {totalPasos > 0 && (
          <>
            <div className="step-progress" style={{ flex: 1 }}>
              <div className="step-progress-bar" style={{ width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
              {completados}/{totalPasos}
            </span>
          </>
        )}
        {oferta.fechaInicio && (
          <span className="card-date">{formatDate(oferta.fechaInicio)}</span>
        )}
        {cvLinkedCard && (
          <span
            title={`CV: ${cvLinkedCard.nombre}${cvLinkedCard.version ? ` v${cvLinkedCard.version}` : ''}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 10.5, padding: '1px 6px', borderRadius: 20,
              background: 'var(--surface-muted)',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
              marginLeft: 'auto', flexShrink: 0,
              overflow: 'hidden', maxWidth: 100,
            }}
          >
            📄 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cvLinkedCard.nombre}{cvLinkedCard.version ? ` v${cvLinkedCard.version}` : ''}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── OfertaPreviewPanel ─────────────────────────────────────────────────────

function OfertaPreviewPanel({ oferta, onClose }: { oferta: Oferta; onClose: () => void }) {
  const { empresas, contactos, notas, cvs, setPage } = useApp();
  const isMobile = useIsMobile();
  const emp = empresas[oferta.empresa];
  const salario = formatSalario(oferta.moneda, oferta.salarioBrutoOfrecido);
  const scoreVal = scoringAverage(oferta.scoring);
  const linkedNotas = notas.filter((n) => n.ofertaId === oferta.id);
  const linkedContactos = (oferta.contactos ?? []).map((cid) => contactos[cid]).filter(Boolean);
  const cvLinked = oferta.cvEnviadoId
    ? (cvs[oferta.cvEnviadoId] ?? null)
    : null;
  const totalPasos = oferta.pasos?.length ?? 0;
  const completados = oferta.pasos?.filter(p => p.estado === 'completado').length ?? 0;
  const pct = totalPasos > 0 ? (completados / totalPasos) * 100 : 0;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(1px)',
          animation: 'fadeIn 0.18s ease',
        }}
      />
      {/* drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 200,
          width: 360,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
          animation: 'slideInRight 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
          overflowY: 'auto',
        }}
      >
        {/* ── header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <LogoBubble empresa={oferta.empresa} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
              {emp?.nombre ?? oferta.empresa}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text)',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              lineHeight: 1.35,
            }}>
              {oferta.titulo}
            </div>
            <div style={{ marginTop: 6 }}>
              <span className={`badge badge-${oferta.estado}`} style={{ fontSize: 10.5 }}>
                {estadoLabels[oferta.estado]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4, borderRadius: 6,
              fontSize: 16, lineHeight: 1, flexShrink: 0,
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* ── quick stats ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 8, padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          {oferta.modalidad && (
            <div style={{ fontSize: 12 }}>
              <div style={{ color: 'var(--text-subtle)', fontSize: 10.5, marginBottom: 2 }}>Modalidad</div>
              <span style={{ color: 'var(--text-muted)' }}>
                {MODALIDAD_ICONS[oferta.modalidad]} {MODALIDAD_LABELS[oferta.modalidad]}
              </span>
            </div>
          )}
          {oferta.tipoEmpleo && (
            <div style={{ fontSize: 12 }}>
              <div style={{ color: 'var(--text-subtle)', fontSize: 10.5, marginBottom: 2 }}>Tipo</div>
              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{oferta.tipoEmpleo}</span>
            </div>
          )}
          {salario && (
            <div style={{ fontSize: 12 }}>
              <div style={{ color: 'var(--text-subtle)', fontSize: 10.5, marginBottom: 2 }}>Salario bruto</div>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{salario}/mes</span>
            </div>
          )}
          {(oferta.ciudad || oferta.pais) && (
            <div style={{ fontSize: 12 }}>
              <div style={{ color: 'var(--text-subtle)', fontSize: 10.5, marginBottom: 2 }}>Ubicación</div>
              <span style={{ color: 'var(--text-muted)' }}>
                📍 {oferta.ciudad && oferta.ciudad !== 'Remote' ? oferta.ciudad : oferta.pais}
              </span>
            </div>
          )}
        </div>

        {/* ── roadmap ── */}
        {totalPasos > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Roadmap
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                {completados}/{totalPasos} pasos
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="step-progress">
                <div className="step-progress-bar" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {oferta.pasos!.map((paso) => (
                <div key={paso.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: paso.estado !== 'pendiente' ? 'var(--text-muted)' : 'var(--text)',
                  opacity: paso.estado !== 'pendiente' ? 0.7 : 1,
                }}>
                  <span style={{ fontSize: 13 }}>
                    {paso.estado === 'completado' ? '✅' : paso.estado === 'finalizado' ? '❌' : '⬜'}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {paso.emoji ? `${paso.emoji} ` : ''}{paso.titulo}
                  </span>
                  {paso.fecha && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', flexShrink: 0 }}>{formatDate(paso.fecha)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── scoring ── */}
        {scoreVal != null && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Scoring
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{scoreVal}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/100</span>
              <div style={{ flex: 1 }}>
                <div className="step-progress">
                  <div className="step-progress-bar" style={{ width: `${scoreVal}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── notas ── */}
        {linkedNotas.length > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Notas vinculadas ({linkedNotas.length})
            </div>
            {linkedNotas.slice(0, 2).map((nota) => (
              <div key={nota.id} style={{
                fontSize: 12, color: 'var(--text)', marginBottom: 4,
                padding: '5px 8px', borderRadius: 6,
                background: 'var(--surface-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                📝 {nota.titulo}
              </div>
            ))}
            {linkedNotas.length > 2 && (
              <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>+{linkedNotas.length - 2} más</div>
            )}
          </div>
        )}

        {/* ── contactos ── */}
        {linkedContactos.length > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Contactos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {linkedContactos.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: c.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff',
                    flexShrink: 0,
                  }}>
                    {c.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>{c.rol}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CV enviado ── */}
        {oferta.cvEnviadoId && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              CV Enviado
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: 'var(--text)',
              padding: '5px 8px', borderRadius: 6, background: 'var(--surface-muted)',
            }}>
              <span>📄</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cvLinked?.nombre ?? oferta.cvEnviadoId}
              </span>
              {cvLinked?.version && (
                <span style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>v{cvLinked.version}</span>
              )}
            </div>
          </div>
        )}

        {/* tags */}
        {oferta.tags.length > 0 && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {oferta.tags.map((tag) => (
                <span key={tag} className="chip" style={{ fontSize: 11 }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── footer CTA ── */}
        <div style={{ padding: '14px 16px', marginTop: 'auto' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setPage('oferta-detail', oferta.id); onClose(); }}
          >
            Abrir completo →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

// ─── KanbanCard ─────────────────────────────────────────────────────────────

function KanbanCard({
  oferta,
  onDragStart,
  onPreview,
}: {
  oferta: Oferta;
  onDragStart: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  const totalPasos = oferta.pasos?.length ?? 0;
  const completados = oferta.pasos?.filter(p => p.estado === 'completado').length ?? 0;
  const pct = totalPasos > 0 ? (completados / totalPasos) * 100 : 0;
  const { setPage, empresas, cvs } = useApp();
  const salario = formatSalario(oferta.moneda, oferta.salarioBrutoOfrecido);
  const scoreVal = scoringAverage(oferta.scoring);
  const location = oferta.ciudad && oferta.ciudad !== 'Remote' ? oferta.ciudad : oferta.pais;
  const cvLinkedKanban = oferta.cvEnviadoId ? (cvs[oferta.cvEnviadoId] ?? null) : null;

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={() => onDragStart(oferta.id)}
      onClick={() => setPage('oferta-detail', oferta.id)}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <LogoBubble empresa={oferta.empresa} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-subtle)', lineHeight: 1.2, marginBottom: 1 }}>
            {empresas[oferta.empresa]?.nombre ?? oferta.empresa}
          </div>
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: 'var(--text)',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.35,
          }}>
            {oferta.titulo}
          </div>
        </div>
        {/* info button */}
        <button
          title="Vista previa"
          onClick={(e) => { e.stopPropagation(); onPreview(oferta.id); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-subtle)', padding: '2px 3px',
            borderRadius: 5, fontSize: 13, lineHeight: 1,
            flexShrink: 0, marginTop: -1,
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
        >
          ℹ
        </button>
      </div>

      {/* ── body ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

        {/* modalidad pill */}
        {oferta.modalidad && (
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 10.5, padding: '1px 6px', borderRadius: 20,
              background: 'var(--surface-muted)',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
            }}>
              {MODALIDAD_ICONS[oferta.modalidad]} {MODALIDAD_LABELS[oferta.modalidad]}
            </span>
          </div>
        )}

        {/* salary */}
        {salario && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11.5,
            color: 'var(--text-muted)', fontWeight: 500,
          }}>
            {salario}
          </div>
        )}

        {/* location */}
        {location && (
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>📍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
          </div>
        )}

        {/* tags */}
        {oferta.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {oferta.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="chip" style={{ fontSize: 10, padding: '1px 5px' }}>{tag}</span>
            ))}
            {oferta.tags.length > 2 && (
              <span className="chip" style={{ fontSize: 10, padding: '1px 5px', opacity: 0.7 }}>
                +{oferta.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── footer ── */}
      <div style={{
        marginTop: 8, paddingTop: 7,
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {/* progress */}
        {totalPasos > 0 && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="step-progress" style={{ marginBottom: 2 }}>
              <div className="step-progress-bar" style={{ width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>
              {completados}/{totalPasos} pasos
            </span>
          </div>
        )}

        {/* scoring */}
        {scoreVal != null && (
          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            ⭐ {scoreVal}
          </span>
        )}

        {/* CV linked */}
        {cvLinkedKanban && (
          <span
            title={`CV: ${cvLinkedKanban.nombre}${cvLinkedKanban.version ? ` v${cvLinkedKanban.version}` : ''}`}
            style={{ fontSize: 12, flexShrink: 0 }}
          >
            📄
          </span>
        )}
      </div>
    </div>
  );
}

const colColors: Record<string, string> = {
  recibida: 'oklch(0.65 0.18 250)',
  aplicada: 'oklch(0.65 0.18 290)',
  pendiente: 'oklch(0.72 0.16 80)',
  rechazada_yo: 'oklch(0.68 0.18 55)',
  rechazada_empresa: 'oklch(0.62 0.22 25)',
  ignorada: 'oklch(0.55 0.04 250)',
};

function KanbanView({ search }: { search: string }) {
  const { ofertas, moveOferta, showToast } = useApp();
  const visibleOfertas = search
    ? ofertas.filter(
        (o) =>
          o.titulo.toLowerCase().includes(search.toLowerCase()) ||
          (o.empresa?.toLowerCase() ?? '').includes(search.toLowerCase())
      )
    : ofertas;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [previewOfertaId, setPreviewOfertaId] = useState<string | null>(null);

  const previewOferta = previewOfertaId ? ofertas.find((o) => o.id === previewOfertaId) ?? null : null;

  const handleDrop = (col: string) => {
    if (draggingId && col !== (ofertas.find(o => o.id === draggingId)?.estado)) {
      moveOferta(draggingId, col as EstadoOferta);
      showToast(`Oferta movida a ${estadoLabels[col]}`, 'success');
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <>
      <div className="kanban-board">
        {kanbanCols.map((col) => {
          const colOfertas = visibleOfertas.filter((o) => o.estado === col);
          return (
            <div key={col} className="kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-col-dot" style={{ background: colColors[col] }} />
                <span className="kanban-col-title">{estadoLabels[col]}</span>
                <span className="kanban-col-count">{colOfertas.length}</span>
              </div>
              <div
                className={`kanban-col-body${dragOverCol === col ? ' drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => handleDrop(col)}
              >
                {colOfertas.map((o) => (
                  <KanbanCard
                    key={o.id}
                    oferta={o}
                    onDragStart={(id) => setDraggingId(id)}
                    onPreview={(id) => setPreviewOfertaId(id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {previewOferta && (
        <OfertaPreviewPanel
          oferta={previewOferta}
          onClose={() => setPreviewOfertaId(null)}
        />
      )}
    </>
  );
}

function ListView({ search }: { search: string }) {
  const { ofertas, setPage, empresas, cvs } = useApp();
  const visibleOfertas = search
    ? ofertas.filter(
        (o) =>
          o.titulo.toLowerCase().includes(search.toLowerCase()) ||
          (o.empresa?.toLowerCase() ?? '').includes(search.toLowerCase())
      )
    : ofertas;
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table className="list-table">
        <thead>
          <tr>
            <th>Empresa / Rol</th>
            <th>Estado</th>
            <th>Salario</th>
            <th>Modalidad</th>
            <th>CV</th>
            <th>Paso</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {visibleOfertas.map((o) => (
            <tr key={o.id} onClick={() => setPage('oferta-detail', o.id)}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LogoBubble empresa={o.empresa} size={28} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.titulo}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{empresas[o.empresa]?.nombre}</div>
                  </div>
                </div>
              </td>
              <td><span className={`badge badge-${o.estado}`}>{estadoLabels[o.estado]}</span></td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {o.salarioBrutoOfrecido ? `${o.moneda} ${o.salarioBrutoOfrecido.toLocaleString()}` : '—'}
              </td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{o.modalidad}</td>
              <td style={{ fontSize: 12 }}>
                {o.cvEnviadoId ? (() => {
                  const cv = cvs[o.cvEnviadoId];
                  return cv
                    ? <span title={`${cv.nombre}${cv.version ? ` v${cv.version}` : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        📄 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{cv.nombre}{cv.version ? ` v${cv.version}` : ''}</span>
                      </span>
                    : <span style={{ color: 'var(--text-subtle)' }}>📄</span>;
                })() : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
              </td>
              <td style={{ fontSize: 12 }}>{(o.pasos?.filter(p => p.estado === 'completado').length ?? 0)}/{(o.pasos?.length ?? 0)}</td>
              <td style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{formatDate(o.actualizadoEn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Ofertas() {
  const { ofertas, ofertasView, setOfertasView, setPage, refreshAll, refreshing } = useApp();
  const [estadoFilter, setEstadoFilter] = useState<string>('todas');
  const [search, setSearch] = useState('');

  const filteredOfertas = (estadoFilter === 'todas'
    ? ofertas
    : ofertas.filter((o) => o.estado === estadoFilter)
  ).filter((o) =>
    !search ||
    o.titulo.toLowerCase().includes(search.toLowerCase()) ||
    (o.empresa?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: ofertasView === 'kanban' ? '24px 24px 0' : 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis ofertas <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({ofertas.length})</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por rol o empresa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220, fontSize: 13 }}
          />
          <button
            className="view-btn"
            title="Actualizar ofertas"
            onClick={() => refreshAll()}
            disabled={refreshing}
            style={{ opacity: refreshing ? 0.6 : 1, fontSize: 15 }}
          >
            <span style={{ display: 'inline-flex', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
              ↻
            </span>
          </button>
          <div className="view-switcher">
            <button className={`view-btn${ofertasView === 'kanban' ? ' active' : ''}`} onClick={() => setOfertasView('kanban')} title="Kanban">
              <Icon name="columns" size={14} />
            </button>
            <button className={`view-btn${ofertasView === 'cards' ? ' active' : ''}`} onClick={() => setOfertasView('cards')} title="Cards">
              <Icon name="grid" size={14} />
            </button>
            <button className={`view-btn${ofertasView === 'list' ? ' active' : ''}`} onClick={() => setOfertasView('list')} title="Lista">
              <Icon name="list" size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <button className={`filter-pill${estadoFilter === 'todas' ? ' active' : ''}`} onClick={() => setEstadoFilter('todas')}>
          Todas ({ofertas.length})
        </button>
        {kanbanCols.map((col) => {
          const count = ofertas.filter((o) => o.estado === col).length;
          if (count === 0) return null;
          return (
            <button
              key={col}
              className={`filter-pill${estadoFilter === col ? ' active' : ''}`}
              onClick={() => setEstadoFilter(col)}
            >
              {estadoLabels[col]} ({count})
            </button>
          );
        })}
      </div>

      {ofertasView === 'kanban' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <KanbanView search={search} />
        </div>
      )}
      {ofertasView === 'cards' && (
        <div className="grid-3" style={{ flex: 1, overflowY: 'auto' }}>
          {filteredOfertas.map((o) => (
            <OfertaCard key={o.id} oferta={o} onClick={() => setPage('oferta-detail', o.id)} />
          ))}
        </div>
      )}
      {ofertasView === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ListView search={search} />
        </div>
      )}
    </div>
  );
}

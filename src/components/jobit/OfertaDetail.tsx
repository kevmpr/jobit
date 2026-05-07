import { useState } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { scoringDimensions, estadoLabels, kanbanCols, estadoColors } from './data';
import type { ScoringDimension, PasoRoadmap } from './types';

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

function DetallesTab({ ofertaId }: { ofertaId: string }) {
  const { ofertas, empresas, contactos } = useApp();
  const oferta = ofertas.find((o) => o.id === ofertaId);
  if (!oferta) return null;
  const emp = empresas[oferta.empresa];
  const ofertaContactos = oferta.contactos.map((id) => contactos[id]).filter((c): c is NonNullable<typeof c> => c != null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Compensación */}
        <div className="card">
          <div className="card-header"><span className="card-title">Compensación</span></div>
          <div className="card-body">
            <div className="comp-grid">
              <div className="comp-cell">
                <div className="comp-cell-label">Bruto ofrecido</div>
                <div className="comp-cell-value">{oferta.moneda} {oferta.salarioBrutoOfrecido?.toLocaleString() ?? '—'}</div>
                <div className="comp-cell-sub">por mes</div>
              </div>
              <div className="comp-cell">
                <div className="comp-cell-label">Neto estimado</div>
                <div className="comp-cell-value">{oferta.moneda} {oferta.salarioNetoOfrecido?.toLocaleString() ?? '—'}</div>
                <div className="comp-cell-sub">por mes</div>
              </div>
              <div className="comp-cell">
                <div className="comp-cell-label">Mi pretensión</div>
                <div className="comp-cell-value">{oferta.moneda} {oferta.pretension?.toLocaleString() ?? '—'}</div>
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
              <dt>Modalidad</dt><dd style={{ textTransform: 'capitalize' }}>{oferta.modalidad}</dd>
              <dt>Tipo empleo</dt><dd>{oferta.tipoEmpleo}</dd>
              <dt>Jornada</dt><dd>{oferta.jornada}</dd>
              <dt>Ubicación</dt><dd>{oferta.ciudad}, {oferta.pais}</dd>
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
            {oferta.cvEnviado ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="file" size={16} stroke="oklch(0.52 0.20 250)" />
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{oferta.cvEnviado}</span>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>No enviado aún</span>
            )}
          </div>
        </div>

        {/* Próximo paso */}
        {oferta.proximaFecha && (
          <div className="card" style={{ background: 'var(--color-brand-light)', border: '1px solid oklch(0.52 0.20 250 / 0.3)' }}>
            <div className="card-header" style={{ border: 'none', paddingBottom: 8 }}>
              <span className="card-title" style={{ color: 'oklch(0.42 0.22 250)' }}>Próximo paso</span>
            </div>
            <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="calendar" size={18} stroke="oklch(0.52 0.20 250)" />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'oklch(0.42 0.22 250)' }}>
                  {oferta.proximaFecha}
                </div>
                <div style={{ fontSize: 12, color: 'oklch(0.52 0.20 250 / 0.8)' }}>Fecha estimada</div>
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
      </div>
    </div>
  );
}

function RoadmapTab({ ofertaId, mode }: { ofertaId: string; mode: 'vertical' | 'stepper' | 'kanban' }) {
  const { roadmapPasos } = useApp();
  const dbSteps = roadmapPasos[ofertaId];
  const steps: PasoRoadmap[] = dbSteps && dbSteps.length > 0 ? dbSteps : [
    { id: 'r1', titulo: 'Aplicación enviada', fecha: null, descripcion: 'CV enviado para el proceso.', estado: 'completado' },
    { id: 'r2', titulo: 'Screening HR', fecha: null, descripcion: 'Llamada inicial con RRHH.', estado: 'pendiente' },
    { id: 'r3', titulo: 'Entrevista técnica', fecha: null, descripcion: 'Evaluación técnica del stack.', estado: 'pendiente' },
    { id: 'r4', titulo: 'Oferta', fecha: null, descripcion: 'Recepción y negociación de oferta.', estado: 'pendiente' },
  ];

  if (mode === 'vertical') {
    return (
      <div>
        {steps.map((step, i) => (
          <div key={step.id} className="roadmap-step">
            <div className="roadmap-rail">
              <div className={`roadmap-pin${step.estado === 'completado' ? ' completed' : step.estado === 'actual' ? ' current' : ''}`}>
                {step.estado === 'completado' && <Icon name="check" size={10} stroke="white" />}
                {step.estado === 'actual' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.52 0.20 250)' }} />}
              </div>
              {i < steps.length - 1 && <div className="roadmap-connector" />}
            </div>
            <div style={{ flex: 1 }}>
              <div className={`roadmap-card${step.estado === 'actual' ? ' current' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{step.titulo}</div>
                  {step.fecha && <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>{step.fecha}</span>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.descripcion}</p>
                {step.adjuntos && step.adjuntos.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    {step.adjuntos.map((adj) => (
                      <span key={adj} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'oklch(0.52 0.20 250)', cursor: 'pointer' }}>
                        <Icon name="paperclip" size={12} stroke="oklch(0.52 0.20 250)" />
                        {adj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'stepper') {
    return (
      <div>
        <div className="stepper" style={{ marginBottom: 24 }}>
          {steps.map((step) => (
            <div key={step.id} className="stepper-step">
              <div className={`stepper-track${step.estado === 'completado' ? ' done' : step.estado === 'actual' ? ' current' : ''}`} />
              <div className="stepper-label">{step.titulo}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((step) => (
            <div key={step.id} className="roadmap-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div className={`roadmap-pin${step.estado === 'completado' ? ' completed' : step.estado === 'actual' ? ' current' : ''}`} style={{ position: 'relative' }}>
                  {step.estado === 'completado' && <Icon name="check" size={10} stroke="white" />}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{step.titulo}</span>
                {step.fecha && <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{step.fecha}</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Kanban mode
  const cols = ['pendiente', 'en_curso', 'completado', 'cancelado'];
  const colLabels: Record<string, string> = { pendiente: 'Pendiente', en_curso: 'En curso', completado: 'Completado', cancelado: 'Cancelado' };
  const getStepCol = (step: PasoRoadmap) => {
    if (step.estado === 'completado') return 'completado';
    if (step.estado === 'actual') return 'en_curso';
    if (step.estado === 'cancelado') return 'cancelado';
    return 'pendiente';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {cols.map((col) => (
        <div key={col}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {colLabels[col]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.filter((s) => getStepCol(s) === col).map((step) => (
              <div key={step.id} className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{step.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.fecha ?? 'Sin fecha'}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoringTab({ ofertaId }: { ofertaId: string }) {
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(scoringDimensions.map((d) => [d.key, d.value]))
  );
  const [highlightRow, setHighlightRow] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePip = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
    setHighlightRow(key);
    setSaving(true);
    setTimeout(() => { setSaving(false); setHighlightRow(null); }, 1500);
  };

  const total = Math.round(
    Object.entries(scores).reduce((sum, [, v]) => sum + v, 0) / scoringDimensions.length * 20
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20 }}>
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
          {scoringDimensions.map((dim) => (
            <div key={dim.key} className={`scoring-row${highlightRow === dim.key ? ' highlight' : ''}`}>
              <span className="scoring-label">{dim.label}</span>
              <div className="scoring-pips">
                {[1, 2, 3, 4, 5].map((pip) => (
                  <button
                    key={pip}
                    className={`pip${scores[dim.key] >= pip ? ' active' : ''}`}
                    onClick={() => handlePip(dim.key, pip)}
                    title={`${pip}/5`}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', width: 24, textAlign: 'right' }}>
                {scores[dim.key]}/5
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Score total
          </div>
          <div style={{
            fontSize: 60, fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: total >= 80 ? 'oklch(0.70 0.19 155)' : total >= 60 ? 'oklch(0.52 0.20 250)' : 'oklch(0.58 0.22 25)',
            lineHeight: 1
          }}>
            {total}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 6 }}>/100</div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkles" size={14} stroke="oklch(0.52 0.20 250)" />
            Insight
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {total >= 80
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
  const { ofertas, contactos, empresas } = useApp();
  const oferta = ofertas.find((o) => o.id === ofertaId);
  if (!oferta) return null;
  const ofertaContactos = oferta.contactos.map((id) => contactos[id]).filter((c): c is NonNullable<typeof c> => c != null);

  if (ofertaContactos.length === 0) {
    return <div style={{ color: 'var(--text-subtle)', padding: 20, textAlign: 'center' }}>No hay contactos registrados</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {ofertaContactos.map((c) => (
        <div key={c.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: c.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 14, fontWeight: 700, flexShrink: 0
          }}>{c.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.nombre}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.rol} · {empresas[c.empresa]?.nombre ?? c.empresa}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'oklch(0.52 0.20 250)', textDecoration: 'none' }}>
              <Icon name="mail" size={14} stroke="oklch(0.52 0.20 250)" /> Email
            </a>
            <a href={`https://${c.linkedin}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'oklch(0.52 0.20 250)', textDecoration: 'none' }}>
              <Icon name="link" size={14} stroke="oklch(0.52 0.20 250)" /> LinkedIn
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdjuntosTab() {
  const files = ['Propuesta_tecnica.pdf', 'Notas_entrevista.md', 'CV_enviado.pdf'];
  return (
    <div className="grid-3">
      {files.map((file) => (
        <div key={file} className="file-card">
          <div className="file-thumbnail" style={{ background: 'var(--surface-sunken)' }}>
            <div className="file-paper">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="file-paper-line" style={{ width: i === 0 ? '60%' : `${50 + Math.random() * 40}%` }} />
              ))}
            </div>
          </div>
          <div className="file-info">
            <div className="file-name">{file}</div>
            <div className="file-meta">128 KB · hace 3 días</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotasTab({ ofertaId }: { ofertaId: string }) {
  const { notas } = useApp();
  const relatedNota = notas.find((n) => n.ofertaId === ofertaId);
  return (
    <div className="card" style={{ padding: 20 }}>
      {relatedNota ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>{relatedNota.titulo}</div>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
            {relatedNota.contenido}
          </pre>
        </>
      ) : (
        <div style={{ color: 'var(--text-subtle)', textAlign: 'center', padding: 20 }}>
          No hay notas para esta oferta. ¡Añade una desde la página de Notas!
        </div>
      )}
    </div>
  );
}

export function OfertaDetail() {
  const { ofertaId, ofertas, empresas, setPage, tweaks, showToast, moveOferta } = useApp();
  const oferta = ofertas.find((o) => o.id === ofertaId);
  const [tab, setTab] = useState<'detalles' | 'roadmap' | 'contactos' | 'adjuntos' | 'scoring' | 'notas'>('detalles');
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);

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
    { id: 'notas', label: 'Notas' },
  ] as const;

  return (
    <div className="page-content">
      <button className="back-btn" onClick={() => setPage('ofertas')}>
        <Icon name="chevronLeft" size={16} /> Mis ofertas
      </button>

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
            <span className="lead-sep">·</span>
            <span style={{ textTransform: 'capitalize' }}>{oferta.modalidad}</span>
            <span className="lead-sep">·</span>
            <span>{oferta.ciudad}, {oferta.pais}</span>
            {oferta.salarioBrutoOfrecido && <>
              <span className="lead-sep">·</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
                {oferta.moneda} {oferta.salarioBrutoOfrecido.toLocaleString()}/mes
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
          <button className="btn btn-ghost">
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
          <button className="btn btn-danger">
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>

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
      {tab === 'roadmap' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div className="segmented">
              {(['vertical', 'stepper', 'kanban'] as const).map((m) => (
                <button key={m} className={`segmented-btn${tweaks.roadmap === m ? ' active' : ''}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <RoadmapTab ofertaId={oferta.id} mode={tweaks.roadmap} />
        </div>
      )}
      {tab === 'contactos' && <ContactosTab ofertaId={oferta.id} />}
      {tab === 'adjuntos' && <AdjuntosTab />}
      {tab === 'scoring' && <ScoringTab ofertaId={oferta.id} />}
      {tab === 'notas' && <NotasTab ofertaId={oferta.id} />}
    </div>
  );
}

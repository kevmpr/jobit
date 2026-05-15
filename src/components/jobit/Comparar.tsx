import { useState, useMemo } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { estadoLabels } from './data';
import type { Oferta } from './types';

const MAX_COMPARE = 4;

const dimensions = [
  { key: 'salario', label: 'Compensación', max: 15000 },
  { key: 'tecnologia', label: 'Stack técnico' },
  { key: 'cultura', label: 'Cultura' },
  { key: 'crecimiento', label: 'Crecimiento' },
  { key: 'wlb', label: 'WLB' },
  { key: 'impacto', label: 'Impacto' },
  { key: 'equipo', label: 'Equipo' },
  { key: 'estabilidad', label: 'Estabilidad' },
];

/** Deterministic 0–1 score for a dimension that has no real DB field. */
function stableScore(id: string, salt: string): number {
  const raw = parseInt((id + salt).replace(/\D/g, '').slice(-4) || '5000', 10);
  return Math.max(0.2, Math.min(1, (raw % 100) / 100));
}

function RadarChart({ ofertas, empresas }: { ofertas: Oferta[]; empresas: Record<string, import('./types').Empresa> }) {
  const cx = 200, cy = 200, r = 160;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  const n = dimensions.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (idx: number, pct: number) => {
    const angle = idx * angleStep - Math.PI / 2;
    return {
      x: cx + r * pct * Math.cos(angle),
      y: cy + r * pct * Math.sin(angle),
    };
  };

  const axisPoints = dimensions.map((_, i) => getPoint(i, 1));

  const colors = [
    'oklch(0.55 0.16 250)',
    'oklch(0.70 0.19 155)',
    'oklch(0.74 0.16 70)',
    'oklch(0.65 0.18 320)',
  ];

  // Stable scores keyed on offer IDs — no Math.random()
  const ofertaScores = useMemo(
    () =>
      ofertas.map((o) =>
        dimensions.map((d) => {
          if (d.key === 'salario')
            return o.salarioBrutoOfrecido ? Math.min(1, o.salarioBrutoOfrecido / 15000) : 0.5;
          // Use scoring as a base + deterministic per-dimension offset
          const base = o.scoring / 100;
          const offset = stableScore(o.id, d.key) * 0.3 - 0.15;
          return Math.max(0.2, Math.min(1, base + offset));
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ofertas.map((o) => o.id).join(',')]
  );

  // Dynamic insights
  const highestSalary = ofertas.length
    ? ofertas.reduce((best, o) =>
        (o.salarioBrutoOfrecido ?? 0) > (best.salarioBrutoOfrecido ?? 0) ? o : best
      )
    : null;

  const mostAdvanced = ofertas.length
    ? ofertas.reduce((best, o) => {
        const ratioO = o.pasosTotales > 0 ? o.pasoActual / o.pasosTotales : 0;
        const ratioBest = best.pasosTotales > 0 ? best.pasoActual / best.pasosTotales : 0;
        return ratioO > ratioBest ? o : best;
      })
    : null;

  return (
    <div className="radar-container" style={{ alignItems: 'flex-start' }}>
      <svg width="400" height="400" viewBox="0 0 400 400">
        {/* Rings */}
        {rings.map((pct) => {
          const pts = dimensions.map((_, i) => {
            const p = getPoint(i, pct);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={pct} points={pts} fill="none" stroke="var(--border)" strokeWidth={1} />;
        })}

        {/* Axes */}
        {axisPoints.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />
        ))}

        {/* Polygons */}
        {ofertaScores.map((scores, oi) => {
          const pts = scores.map((s, i) => {
            const p = getPoint(i, s);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={oi}
              points={pts}
              fill={colors[oi]}
              fillOpacity={0.15}
              stroke={colors[oi]}
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {dimensions.map((dim, i) => {
          const p = getPoint(i, 1.18);
          return (
            <text
              key={dim.key}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
            >
              {dim.label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 12 }}>Leyenda</div>
        {ofertas.map((o, i) => (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: colors[i] }} />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{o.titulo} · {empresas[o.empresa]?.nombre}</span>
          </div>
        ))}

        <div className="card" style={{ marginTop: 20, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkles" size={13} stroke="oklch(0.52 0.20 250)" /> Insights
          </div>
          <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {highestSalary && (
              <li style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {empresas[highestSalary.empresa]?.nombre ?? highestSalary.titulo} tiene la mayor compensación ofrecida
              </li>
            )}
            {mostAdvanced && (
              <li style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {empresas[mostAdvanced.empresa]?.nombre ?? mostAdvanced.titulo} está más avanzada en el proceso
              </li>
            )}
            {ofertas.length >= 2 && (
              <li style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Comparando {ofertas.length} ofertas — revisá el radar para comparar dimensiones clave
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TablaView({ ofertas, empresas, baselineBruto, baselineNeto }: {
  ofertas: Oferta[];
  empresas: Record<string, import('./types').Empresa>;
  baselineBruto: number;
  baselineNeto: number;
}) {
  const rows = [
    { label: 'Salario bruto', getValue: (o: Oferta) => o.salarioBrutoOfrecido ? `${o.moneda} ${o.salarioBrutoOfrecido.toLocaleString()}` : '—' },
    { label: 'Salario neto', getValue: (o: Oferta) => o.salarioNetoOfrecido ? `${o.moneda} ${o.salarioNetoOfrecido.toLocaleString()}` : '—' },
    { label: 'Estado', getValue: (o: Oferta) => estadoLabels[o.estado] },
    { label: 'Modalidad', getValue: (o: Oferta) => o.modalidad },
    { label: 'País', getValue: (o: Oferta) => o.pais },
    { label: 'Stack', getValue: (o: Oferta) => o.tags.join(', ') },
    { label: 'Scoring', getValue: (o: Oferta) => `${o.scoring}/100` },
    { label: 'Fecha de inicio', getValue: (o: Oferta) => o.fechaInicio ?? '—' },
  ];

  const fmtBaseline = (val: number) => val > 0 ? `${val.toLocaleString()}` : '—';

  return (
    <div className="card" style={{ overflow: 'auto' }}>
      <table className="list-table" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ width: 140 }}>Dimensión</th>
            <th>Situación actual</th>
            {ofertas.map((o) => (
              <th key={o.id}>{empresas[o.empresa]?.nombre}<br /><span style={{ fontWeight: 400 }}>{o.titulo}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{row.label}</td>
              <td style={{ color: 'var(--text-subtle)' }}>
                {row.label === 'Salario bruto'
                  ? (baselineBruto > 0 ? fmtBaseline(baselineBruto) : '—')
                  : row.label === 'Salario neto'
                  ? (baselineNeto > 0 ? fmtBaseline(baselineNeto) : '—')
                  : '—'}
              </td>
              {ofertas.map((o) => {
                const val = row.getValue(o);
                const isDelta = row.label === 'Salario bruto' && o.salarioBrutoOfrecido && baselineBruto > 0;
                const delta = isDelta && o.salarioBrutoOfrecido
                  ? Math.round(((o.salarioBrutoOfrecido - baselineBruto) / baselineBruto) * 100)
                  : null;
                return (
                  <td key={o.id} style={{ fontFamily: row.label === 'Scoring' ? 'var(--font-mono)' : undefined }}>
                    {val}
                    {delta !== null && (
                      <span style={{
                        marginLeft: 6, fontSize: 10.5, fontWeight: 600,
                        color: delta > 0 ? 'oklch(0.70 0.19 155)' : 'oklch(0.58 0.22 25)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsView({ ofertas, empresas, baselineBruto }: {
  ofertas: Oferta[];
  empresas: Record<string, import('./types').Empresa>;
  baselineBruto: number;
}) {
  const bestScorer = ofertas.reduce((best, o) => o.scoring > best.scoring ? o : best, ofertas[0]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `280px repeat(${ofertas.length}, 1fr)`, gap: 16, marginBottom: 20 }}>
        {/* Situación actual */}
        <div className="compare-card current">
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'oklch(0.94 0.06 155)', color: 'oklch(0.50 0.19 155)', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
              <Icon name="home" size={11} stroke="oklch(0.50 0.19 155)" /> Situación actual
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Trabajo actual</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Pretensión salarial</div>
          </div>
          <dl className="info-grid">
            <dt>Salario bruto</dt>
            <dd style={{ fontFamily: 'var(--font-mono)' }}>
              {baselineBruto > 0 ? baselineBruto.toLocaleString() : '—'}
            </dd>
            <dt>Modalidad</dt><dd>—</dd>
          </dl>
        </div>

        {/* Offer cards */}
        {ofertas.map((o) => (
          <div key={o.id} className={`compare-card${o.id === bestScorer.id ? ' best' : ''}`}>
            {o.id === bestScorer.id && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--color-brand-light)', color: 'oklch(0.52 0.20 250)', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                <Icon name="star" size={11} stroke="oklch(0.52 0.20 250)" fill="oklch(0.52 0.20 250)" /> Mejor match
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: empresas[o.empresa]?.color ?? 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
                {empresas[o.empresa]?.logo}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{o.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{empresas[o.empresa]?.nombre}</div>
              </div>
            </div>
            <dl className="info-grid">
              <dt>Salario bruto</dt><dd style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {o.salarioBrutoOfrecido ? `${o.moneda} ${o.salarioBrutoOfrecido.toLocaleString()}` : '—'}
              </dd>
              <dt>Estado</dt><dd><span className={`badge badge-${o.estado}`} style={{ fontSize: 10 }}>{estadoLabels[o.estado]}</span></dd>
              <dt>Modalidad</dt><dd style={{ textTransform: 'capitalize' }}>{o.modalidad}</dd>
              <dt>Score</dt><dd style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'oklch(0.52 0.20 250)' }}>{o.scoring}</dd>
            </dl>
          </div>
        ))}
      </div>

      <div className="recommendation-card">
        <Icon name="sparkles" size={20} stroke="oklch(0.52 0.20 250)" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'oklch(0.42 0.22 250)', marginBottom: 4 }}>Recomendación</div>
          <p style={{ fontSize: 13.5, color: 'oklch(0.42 0.22 250 / 0.8)', lineHeight: 1.6 }}>
            <strong>{empresas[bestScorer.empresa]?.nombre ?? bestScorer.titulo}</strong> es el mejor match con un score de {bestScorer.scoring}/100
            {bestScorer.salarioBrutoOfrecido ? ` y una oferta de ${bestScorer.moneda} ${bestScorer.salarioBrutoOfrecido.toLocaleString()}` : ''}.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Comparar() {
  const { ofertas, empresas, perfil } = useApp();
  const [viewMode, setViewMode] = useState<'cards' | 'tabla' | 'radar'>('cards');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const baselineBruto = perfil?.pretensionBruta ?? 0;
  const baselineNeto = perfil?.pretensionNeta ?? 0;

  const toggleId = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const compareOfertas = useMemo(
    () => compareIds.map((id) => ofertas.find((o) => o.id === id)).filter((o): o is Oferta => o !== undefined),
    [compareIds, ofertas]
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comparar ofertas</h1>
          <p className="page-subtitle">
            {compareOfertas.length >= 2
              ? `Comparando ${compareOfertas.length} ofertas seleccionadas`
              : 'Seleccioná al menos 2 ofertas para comparar'}
          </p>
        </div>
        <div className="view-switcher">
          {(['cards', 'tabla', 'radar'] as const).map((m) => (
            <button key={m} className={`view-btn${viewMode === m ? ' active' : ''}`} onClick={() => setViewMode(m)} title={m.charAt(0).toUpperCase() + m.slice(1)}>
              <Icon name={m === 'cards' ? 'cards' : m === 'tabla' ? 'table' : 'radar'} size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Offer selection panel */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 10 }}>
          Seleccioná las ofertas a comparar (máx. {MAX_COMPARE})
        </div>
        {ofertas.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>No hay ofertas disponibles.</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ofertas.map((o) => {
              const selected = compareIds.includes(o.id);
              const disabled = !selected && compareIds.length >= MAX_COMPARE;
              return (
                <button
                  key={o.id}
                  onClick={() => !disabled && toggleId(o.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 20,
                    border: selected ? '1.5px solid oklch(0.52 0.20 250)' : '1px solid var(--border)',
                    background: selected ? 'var(--color-brand-light)' : 'var(--surface-raised)',
                    color: selected ? 'oklch(0.52 0.20 250)' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: selected ? 600 : 400,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.45 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: empresas[o.empresa]?.color ?? 'var(--surface-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 7, fontWeight: 700,
                  }}>
                    {empresas[o.empresa]?.logo?.slice(0, 1)}
                  </div>
                  {o.titulo}
                  {selected && (
                    <Icon name="x" size={11} stroke="oklch(0.52 0.20 250)" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active selections strip */}
      {compareOfertas.length > 0 && (
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          {compareOfertas.map((o) => (
            <span key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: empresas[o.empresa]?.color ?? 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 7, fontWeight: 700 }}>
                {empresas[o.empresa]?.logo?.slice(0, 1)}
              </div>
              {empresas[o.empresa]?.nombre}
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'oklch(0.94 0.06 155)', border: '1px solid oklch(0.70 0.19 155)', borderRadius: 20, fontSize: 12, color: 'oklch(0.50 0.19 155)', fontWeight: 500 }}>
            <Icon name="home" size={11} stroke="oklch(0.50 0.19 155)" /> Mi situación actual
          </span>
        </div>
      )}

      {/* Placeholder when fewer than 2 selected */}
      {compareOfertas.length < 2 && (
        <div className="card" style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-subtle)' }}>
          <Icon name="radar" size={32} stroke="var(--text-subtle)" />
          <span style={{ fontSize: 14 }}>Seleccioná al menos 2 ofertas para comparar</span>
        </div>
      )}

      {compareOfertas.length >= 2 && viewMode === 'cards' && (
        <CardsView ofertas={compareOfertas} empresas={empresas} baselineBruto={baselineBruto} />
      )}
      {compareOfertas.length >= 2 && viewMode === 'tabla' && (
        <TablaView ofertas={compareOfertas} empresas={empresas} baselineBruto={baselineBruto} baselineNeto={baselineNeto} />
      )}
      {compareOfertas.length >= 2 && viewMode === 'radar' && (
        <div className="card" style={{ padding: 24 }}>
          <RadarChart ofertas={compareOfertas} empresas={empresas} />
        </div>
      )}
    </div>
  );
}

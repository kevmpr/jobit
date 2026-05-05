import React, { useState } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { empresas, estadoLabels, scoringDimensions } from './data';
import type { Oferta } from './types';

const COMPARE_IDS = ['o1', 'o3', 'o5'];

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

function RadarChart({ ofertas }: { ofertas: Oferta[] }) {
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
  ];

  // Mock per-oferta scores
  const ofertaScores = ofertas.map((o) => dimensions.map((d) => {
    if (d.key === 'salario') return o.salarioBrutoOfrecido ? Math.min(1, o.salarioBrutoOfrecido / 15000) : 0.5;
    const base = o.scoring / 100;
    return Math.max(0.2, Math.min(1, base + (Math.random() - 0.5) * 0.3));
  }));

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
            <li style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Datadog ofrece la mayor compensación (+26% vs pretensión)</li>
            <li style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Microsoft destaca en stack técnico y crecimiento</li>
            <li style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Auth0 tiene mejor WLB según Glassdoor</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function TablaView({ ofertas }: { ofertas: Oferta[] }) {
  const rows = [
    { label: 'Salario bruto', getValue: (o: Oferta) => o.salarioBrutoOfrecido ? `${o.moneda} ${o.salarioBrutoOfrecido.toLocaleString()}` : '—' },
    { label: 'Salario neto', getValue: (o: Oferta) => o.salarioNetoOfrecido ? `${o.moneda} ${o.salarioNetoOfrecido.toLocaleString()}` : '—' },
    { label: 'Estado', getValue: (o: Oferta) => estadoLabels[o.estado] },
    { label: 'Modalidad', getValue: (o: Oferta) => o.modalidad },
    { label: 'País', getValue: (o: Oferta) => o.pais },
    { label: 'Stack', getValue: (o: Oferta) => o.tags.join(', ') },
    { label: 'Scoring', getValue: (o: Oferta) => `${o.scoring}/100` },
    { label: 'Próxima fecha', getValue: (o: Oferta) => o.proximaFecha ?? '—' },
  ];

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
                {row.label === 'Salario bruto' ? 'USD 4.500' : row.label === 'Salario neto' ? 'USD 3.600' : '—'}
              </td>
              {ofertas.map((o) => {
                const val = row.getValue(o);
                const isDelta = row.label === 'Salario bruto' && o.salarioBrutoOfrecido;
                const delta = isDelta && o.salarioBrutoOfrecido ? Math.round(((o.salarioBrutoOfrecido - 4500) / 4500) * 100) : null;
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

function CardsView({ ofertas }: { ofertas: Oferta[] }) {
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
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Freelance</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Senior Software Engineer</div>
          </div>
          <dl className="info-grid">
            <dt>Salario bruto</dt><dd style={{ fontFamily: 'var(--font-mono)' }}>USD 4.500</dd>
            <dt>Salario neto</dt><dd style={{ fontFamily: 'var(--font-mono)' }}>USD 3.600</dd>
            <dt>Modalidad</dt><dd>Remoto</dd>
            <dt>WLB</dt><dd>Alto</dd>
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
            <strong>Datadog</strong> es el mejor match con un score de {bestScorer.scoring}/100 y la mejor compensación.
            Si valoras el stack técnico y el crecimiento, <strong>Microsoft</strong> es una excelente segunda opción.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Comparar() {
  const { ofertas } = useApp();
  const [viewMode, setViewMode] = useState<'cards' | 'tabla' | 'radar'>('cards');
  const compareOfertas = COMPARE_IDS.map((id) => ofertas.find((o) => o.id === id)).filter((o): o is Oferta => o !== undefined);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comparar ofertas</h1>
          <p className="page-subtitle">Comparando {compareOfertas.length} ofertas seleccionadas</p>
        </div>
        <div className="view-switcher">
          {(['cards', 'tabla', 'radar'] as const).map((m) => (
            <button key={m} className={`view-btn${viewMode === m ? ' active' : ''}`} onClick={() => setViewMode(m)} title={m.charAt(0).toUpperCase() + m.slice(1)}>
              <Icon name={m === 'cards' ? 'cards' : m === 'tabla' ? 'table' : 'radar'} size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar">
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

      {viewMode === 'cards' && <CardsView ofertas={compareOfertas} />}
      {viewMode === 'tabla' && <TablaView ofertas={compareOfertas} />}
      {viewMode === 'radar' && (
        <div className="card" style={{ padding: 24 }}>
          <RadarChart ofertas={compareOfertas} />
        </div>
      )}
    </div>
  );
}

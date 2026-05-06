import React, { useMemo } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { estadoLabels, estadoColors } from './data';
import type { EstadoOferta } from './types';

function MetricCard({ label, value, delta, deltaDir }: {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: 'up' | 'down';
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {delta && (
        <div className={`metric-delta ${deltaDir === 'up' ? 'delta-up' : 'delta-down'}`}>
          <Icon name={deltaDir === 'up' ? 'arrowUp' : 'arrowDown'} size={10} />
          {delta}
        </div>
      )}
    </div>
  );
}

function FunnelChart() {
  const steps = [
    { label: 'Aplicadas', count: 12, pct: 100 },
    { label: 'Screening HR', count: 9, pct: 75 },
    { label: 'Técnica', count: 6, pct: 50 },
    { label: 'Cultural', count: 4, pct: 33 },
    { label: 'Oferta', count: 2, pct: 17 },
  ];

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="card-title" style={{ marginBottom: 16 }}>Funnel de proceso</div>
      {steps.map((step) => (
        <div key={step.label} className="funnel-bar">
          <span className="funnel-label">{step.label}</span>
          <div className="funnel-track">
            <div className="funnel-fill" style={{ width: `${step.pct}%` }}>
              <span className="funnel-count">{step.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ ofertas }: { ofertas: Array<{ estado: EstadoOferta }> }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    ofertas.forEach((o) => {
      map[o.estado] = (map[o.estado] ?? 0) + 1;
    });
    return map;
  }, [ofertas]);

  const total = ofertas.length;
  const colors = estadoColors;

  // Build SVG arcs
  const cx = 60, cy = 60, r = 48, innerR = 30;
  let angle = -Math.PI / 2;
  const arcs: Array<{ path: string; color: string; estado: string; count: number }> = [];

  Object.entries(counts).forEach(([estado, count]) => {
    const sweep = (count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const ix1 = cx + innerR * Math.cos(angle);
    const iy1 = cy + innerR * Math.sin(angle);
    const ix2 = cx + innerR * Math.cos(angle + sweep);
    const iy2 = cy + innerR * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    arcs.push({
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`,
      color: colors[estado] ?? 'oklch(0.55 0 0)',
      estado,
      count,
    });
    angle += sweep;
  });

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="card-title" style={{ marginBottom: 16 }}>Por estado</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {arcs.map((arc) => (
            <path key={arc.estado} d={arc.path} fill={arc.color} />
          ))}
          <text x="60" y="58" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{total}</text>
          <text x="60" y="72" textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-subtle)' }}>ofertas</text>
        </svg>
        <div className="donut-legend">
          {arcs.map((arc) => (
            <div key={arc.estado} className="donut-legend-item">
              <div className="donut-dot" style={{ background: arc.color }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{estadoLabels[arc.estado]}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{arc.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityBarChart() {
  // 30 days of mock activity
  const bars = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: Math.floor(Math.random() * 5) + (i > 20 ? 2 : 0),
  }));

  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="card-title" style={{ marginBottom: 16 }}>Actividad — últimos 30 días</div>
      <div className="bar-chart" style={{ height: 70 }}>
        {bars.map((bar) => (
          <div
            key={bar.day}
            className="bar-chart-bar"
            style={{
              height: `${Math.max(4, (bar.value / max) * 100)}%`,
              background: bar.value > 3 ? 'oklch(0.52 0.20 250)' : bar.value > 1 ? 'oklch(0.52 0.20 250 / 0.6)' : 'var(--border)',
            }}
            title={`Día ${bar.day}: ${bar.value} acciones`}
          />
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { ofertas, actividadLog, empresas, setPage } = useApp();

  const activeOfertas = ofertas.filter((o) => !['rechazada_empresa', 'ghosted'].includes(o.estado));
  const inProcess = ofertas.filter((o) => o.estado === 'en_proceso');
  const applied = ofertas.filter((o) => ['aplicada', 'en_proceso', 'oferta_recibida'].includes(o.estado));
  const respRate = applied.length > 0 ? Math.round((inProcess.length / applied.length) * 100) : 0;
  const avgSalary = (offers: Array<{ salarioBrutoOfrecido: number | null }>): number => {
    const withSalary = offers.filter((o) => o.salarioBrutoOfrecido !== null);
    if (withSalary.length === 0) return 0;
    return Math.round(withSalary.reduce((sum, o) => sum + (o.salarioBrutoOfrecido ?? 0), 0) / withSalary.length / 1000);
  };

  const recentOfertas = [...ofertas].sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn)).slice(0, 5);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buenos días, Kevin 👋</h1>
          <p className="page-subtitle">
            Tienes {inProcess.length} entrevistas activas y {ofertas.filter(o => o.estado === 'oferta_recibida').length} oferta(s) pendiente(s) de respuesta.
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Ofertas activas" value={String(activeOfertas.length)} delta="+2 esta semana" deltaDir="up" />
        <MetricCard label="En proceso" value={String(inProcess.length)} delta="+1 esta semana" deltaDir="up" />
        <MetricCard label="Tasa de respuesta" value={`${respRate}%`} delta="+5%" deltaDir="up" />
        <MetricCard label="Tasa de conversión" value="25%" delta="-2%" deltaDir="down" />
        <MetricCard label="Salario prom. (k USD)" value={`${avgSalary(ofertas)}k`} delta="+0.5k" deltaDir="up" />
        <MetricCard label="Tiempo promedio (d)" value="18d" delta="-3d" deltaDir="up" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, marginBottom: 16 }}>
        <FunnelChart />
        <DonutChart ofertas={ofertas} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <ActivityBarChart />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Actividad reciente</span>
          </div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {activityLog.slice(0, 7).map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-dot" style={{
                  background: item.tipo === 'rechazo' ? 'oklch(0.58 0.22 25)'
                    : item.tipo === 'oferta' ? 'oklch(0.70 0.19 155)'
                    : 'oklch(0.52 0.20 250)'
                }} />
                <div>
                  <div className="activity-text">{item.texto}</div>
                  <div className="activity-time">{new Date(item.timestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent offers */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ofertas recientes</span>
            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setPage('ofertas')}>
              Ver todas
            </button>
          </div>
          <div style={{ padding: '4px 0' }}>
            {recentOfertas.map((o) => (
              <div
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
                onClick={() => setPage('oferta-detail', o.id)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-sunken)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titulo}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{empresas[o.empresa]?.nombre ?? o.empresa}</div>
                </div>
                <span className={`badge badge-${o.estado}`} style={{ flexShrink: 0 }}>
                  {estadoLabels[o.estado]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

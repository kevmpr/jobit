import { useMemo } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { estadoLabels, estadoColors, kanbanCols } from './data';
import type { EstadoOferta, ActivityItem, PasoRoadmap } from './types';
import { formatDate } from '../../lib/utils';
import { useIsMobile } from './hooks';

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  context,
  accentColor = 'var(--color-brand)',
}: {
  label: string;
  value: string;
  icon: string;
  context?: string;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        borderLeft: `3px solid ${accentColor}`,
        padding: '18px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ color: accentColor, opacity: 0.8 }}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
        {value}
      </div>
      {context && (
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{context}</div>
      )}
    </div>
  );
}

// ─── Pipeline Funnel ─────────────────────────────────────────────────────────

const PIPELINE_ORDER: EstadoOferta[] = [
  'recibida',
  'aplicada',
  'pendiente',
  'rechazada_yo',
  'rechazada_empresa',
  'ignorada',
];

function PipelineFunnel({ ofertas }: { ofertas: Array<{ estado: EstadoOferta }> }) {
  const counts = useMemo(() => {
    const map: Partial<Record<EstadoOferta, number>> = {};
    ofertas.forEach((o) => {
      map[o.estado] = (map[o.estado] ?? 0) + 1;
    });
    return map;
  }, [ofertas]);

  const max = Math.max(...PIPELINE_ORDER.map((e) => counts[e] ?? 0), 1);

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: 20,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
        Pipeline por estado
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PIPELINE_ORDER.map((estado) => {
          const count = counts[estado] ?? 0;
          const pct = max > 0 ? (count / max) * 100 : 0;
          const color = estadoColors[estado] ?? 'var(--border-strong)';
          return (
            <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 90, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                {estadoLabels[estado]}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 24,
                  background: 'var(--surface-sunken)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                    background: color,
                    borderRadius: 6,
                    transition: 'width 0.5s ease',
                    opacity: 0.9,
                  }}
                />
              </div>
              <div
                style={{
                  width: 28,
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 700,
                  color: count > 0 ? 'var(--text)' : 'var(--text-subtle)',
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                }}
              >
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ ofertas }: { ofertas: Array<{ estado: EstadoOferta }> }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    ofertas.forEach((o) => {
      map[o.estado] = (map[o.estado] ?? 0) + 1;
    });
    return map;
  }, [ofertas]);

  const total = ofertas.length;

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
      color: estadoColors[estado as EstadoOferta] ?? 'oklch(0.55 0 0)',
      estado,
      count,
    });
    angle += sweep;
  });

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: 20,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
        Distribución
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="var(--surface-sunken)" />
          ) : (
            arcs.map((arc) => (
              <path key={arc.estado} d={arc.path} fill={arc.color} />
            ))
          )}
          <circle cx={cx} cy={cy} r={innerR} fill="var(--surface-raised)" />
          <text x="60" y="57" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{total}</text>
          <text x="60" y="70" textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-subtle)' }}>ofertas</text>
        </svg>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {arcs.map((arc) => (
            <div key={arc.estado} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: arc.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 11.5, flex: 1 }}>{estadoLabels[arc.estado as EstadoOferta]}</span>
              <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{arc.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Próximos pasos ───────────────────────────────────────────────────────────

function ProximosPasos({
  ofertas,
  empresas,
  setPage,
}: {
  ofertas: Array<{ id: string; titulo: string; empresa: string; pasos: PasoRoadmap[] }>;
  empresas: Record<string, { nombre: string; color?: string }>;
  setPage: (page: string, id?: string) => void;
}) {
  const items = useMemo(() => {
    const result: Array<{
      ofertaId: string;
      ofertaTitulo: string;
      empresaNombre: string;
      empresaColor?: string;
      paso: PasoRoadmap;
    }> = [];
    for (const oferta of ofertas) {
      const pendientes = oferta.pasos.filter((p) => p.estado === 'pendiente');
      for (const paso of pendientes) {
        result.push({
          ofertaId: oferta.id,
          ofertaTitulo: oferta.titulo,
          empresaNombre: empresas[oferta.empresa]?.nombre ?? oferta.empresa,
          empresaColor: empresas[oferta.empresa]?.color,
          paso,
        });
        if (result.length >= 6) break;
      }
      if (result.length >= 6) break;
    }
    return result;
  }, [ofertas, empresas]);

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Próximos pasos pendientes</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', background: 'var(--surface-sunken)', borderRadius: 12, padding: '2px 8px', fontFamily: 'var(--font-mono)' }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No hay pasos pendientes 🎉
        </div>
      ) : (
        <div>
          {items.map(({ ofertaId, ofertaTitulo, empresaNombre, empresaColor, paso }) => (
            <div
              key={`${ofertaId}-${paso.id}`}
              onClick={() => setPage('oferta-detail', ofertaId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: empresaColor ?? 'var(--color-brand-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {paso.emoji ?? '📋'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {paso.titulo}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ofertaTitulo} · {empresaNombre}
                </div>
              </div>
              <Icon name="chevronRight" size={14} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Activity Bar Chart ───────────────────────────────────────────────────────

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function ActivityBarChart({ actividadLog }: { actividadLog: ActivityItem[] }) {
  const bars = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 30 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (29 - i));
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const value = actividadLog.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return t >= day.getTime() && t < next.getTime();
      }).length;
      const isLast7 = i >= 23;
      return {
        index: i,
        dayOfWeek: day.getDay(),
        value,
        label: isLast7 ? DAY_LABELS[day.getDay()] : '',
        dateStr: day.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      };
    });
  }, [actividadLog]);

  const max = Math.max(...bars.map((b) => b.value), 1);
  const totalActivity = bars.reduce((s, b) => s + b.value, 0);

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: 20,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Actividad — últimos 30 días</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {totalActivity} acciones
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 72 }}>
          {bars.map((bar) => (
            <div
              key={bar.index}
              title={`${bar.dateStr}: ${bar.value} acciones`}
              style={{
                flex: 1,
                height: `${Math.max(4, (bar.value / max) * 100)}%`,
                background: bar.value > 3
                  ? 'var(--color-brand)'
                  : bar.value > 1
                  ? 'var(--color-brand-light)'
                  : 'var(--border)',
                borderRadius: 3,
                transition: 'height 0.3s ease',
                cursor: bar.value > 0 ? 'default' : undefined,
              }}
            />
          ))}
        </div>
        {/* Last 7 day labels */}
        <div style={{ display: 'flex', gap: 3 }}>
          {bars.map((bar) => (
            <div
              key={bar.index}
              style={{
                flex: 1,
                fontSize: 9,
                textAlign: 'center',
                color: bar.label ? 'var(--text-subtle)' : 'transparent',
                userSelect: 'none',
              }}
            >
              {bar.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Top Empresas ─────────────────────────────────────────────────────────────

function TopEmpresas({
  ofertas,
  empresas,
}: {
  ofertas: Array<{ empresa: string }>;
  empresas: Record<string, { nombre: string; color?: string; industria?: string }>;
}) {
  const top = useMemo(() => {
    const map: Record<string, number> = {};
    ofertas.forEach((o) => {
      map[o.empresa] = (map[o.empresa] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count, empresa: empresas[id] }));
  }, [ofertas, empresas]);

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Top empresas</span>
      </div>
      {top.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Sin datos aún
        </div>
      ) : (
        <div>
          {top.map(({ id, count, empresa }) => (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: empresa?.color ?? 'var(--color-brand)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {empresa?.nombre ?? id}
                </div>
                {empresa?.industria && (
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>{empresa.industria}</div>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '2px 10px',
                  color: 'var(--text)',
                  flexShrink: 0,
                }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recent Offers ────────────────────────────────────────────────────────────

function OfertasRecientes({
  ofertas,
  empresas,
  setPage,
}: {
  ofertas: Array<{ id: string; titulo: string; empresa: string; estado: EstadoOferta; actualizadoEn: string }>;
  empresas: Record<string, { nombre: string; color?: string }>;
  setPage: (page: string, id?: string) => void;
}) {
  const recent = useMemo(
    () => [...ofertas].sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn)).slice(0, 5),
    [ofertas],
  );

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ofertas recientes</span>
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={() => setPage('ofertas')}
        >
          Ver todas
        </button>
      </div>
      <div>
        {recent.map((o) => {
          const empresa = empresas[o.empresa];
          return (
            <div
              key={o.id}
              onClick={() => setPage('oferta-detail', o.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: empresa?.color ?? 'var(--surface-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                {(empresa?.nombre ?? o.empresa).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.titulo}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{empresa?.nombre ?? o.empresa}</span>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  <span>{formatDate(o.actualizadoEn)}</span>
                </div>
              </div>
              <span className={`badge badge-${o.estado}`} style={{ flexShrink: 0 }}>
                {estadoLabels[o.estado]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { ofertas, actividadLog, empresas, setPage, perfil, currentUser } = useApp();
  const isMobile = useIsMobile();

  const firstName = perfil?.nombre ?? currentUser?.email?.split('@')[0] ?? 'ahí';
  const initials = perfil
    ? `${perfil.nombre?.charAt(0) ?? ''}${perfil.apellido?.charAt(0) ?? ''}`.toUpperCase()
    : (firstName.charAt(0) ?? '?').toUpperCase();

  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? 'Buenos días'
      : hour >= 12 && hour < 19
      ? 'Buenas tardes'
      : 'Buenas noches';

  // KPI metrics
  const activeOfertas = useMemo(
    () => ofertas.filter((o) => !['rechazada_empresa', 'rechazada_yo', 'ignorada'].includes(o.estado)),
    [ofertas],
  );
  const inProcess = useMemo(() => ofertas.filter((o) => o.estado === 'pendiente'), [ofertas]);
  const applied = useMemo(
    () => ofertas.filter((o) => ['aplicada', 'pendiente'].includes(o.estado)),
    [ofertas],
  );
  const advanceRate = applied.length > 0
    ? `${Math.round((inProcess.length / applied.length) * 100)}%`
    : '—';

  // Quick subtitle summary
  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (activeOfertas.length > 0) parts.push(`${activeOfertas.length} oferta${activeOfertas.length !== 1 ? 's' : ''} activa${activeOfertas.length !== 1 ? 's' : ''}`);
    if (inProcess.length > 0) parts.push(`${inProcess.length} en proceso`);
    if (parts.length === 0) return 'Empieza a registrar tus ofertas laborales.';
    return parts.join(' · ') + '.';
  }, [activeOfertas, inProcess]);

  return (
    <div className="page-content">
      {/* Hero greeting */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {subtitle}
          </p>
        </div>
        {perfil?.avatarUrl ? (
          <img
            src={perfil.avatarUrl}
            alt={firstName}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--color-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
              letterSpacing: 1,
            }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <KpiCard
          label="Ofertas activas"
          value={String(activeOfertas.length)}
          icon="briefcase"
          context={`de ${ofertas.length} total`}
          accentColor="var(--color-brand)"
        />
        <KpiCard
          label="En proceso"
          value={String(inProcess.length)}
          icon="clock"
          context="esperando respuesta"
          accentColor="var(--color-accent-warm)"
        />
        <KpiCard
          label="Aplicaciones"
          value={String(applied.length)}
          icon="arrowUp"
          context="aplicada + pendiente"
          accentColor="var(--color-accent)"
        />
        <KpiCard
          label="Tasa de avance"
          value={advanceRate}
          icon="star"
          context="pendiente / aplicadas"
          accentColor="var(--color-brand-strong)"
        />
      </div>

      {/* Middle row: pipeline + donut */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 240px',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <PipelineFunnel ofertas={ofertas} />
        <DonutChart ofertas={ofertas} />
      </div>

      {/* Próximos pasos */}
      <div style={{ marginBottom: 16 }}>
        <ProximosPasos ofertas={ofertas} empresas={empresas} setPage={setPage} />
      </div>

      {/* Bottom row: recent + top empresas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <OfertasRecientes ofertas={ofertas} empresas={empresas} setPage={setPage} />
        <TopEmpresas ofertas={ofertas} empresas={empresas} />
      </div>

      {/* Activity chart */}
      <ActivityBarChart actividadLog={actividadLog} />
    </div>
  );
}

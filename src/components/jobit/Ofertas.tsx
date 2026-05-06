import React, { useState } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { kanbanCols, estadoLabels, estadoColors } from './data';
import type { Oferta, EstadoOferta } from './types';

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
  const { empresas } = useApp();
  const pct = oferta.pasosTotales > 0 ? (oferta.pasoActual / oferta.pasosTotales) * 100 : 0;
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
          {oferta.moneda} {oferta.salarioBrutoOfrecido.toLocaleString()}/mes
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {oferta.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="chip">{tag}</span>
        ))}
        {oferta.tags.length > 3 && <span className="chip">+{oferta.tags.length - 3}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="step-progress" style={{ flex: 1 }}>
          <div className="step-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
          {oferta.pasoActual}/{oferta.pasosTotales}
        </span>
        {oferta.proximaFecha && (
          <span className="card-date">{oferta.proximaFecha}</span>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ oferta, onDragStart }: { oferta: Oferta; onDragStart: (id: string) => void }) {
  const pct = oferta.pasosTotales > 0 ? (oferta.pasoActual / oferta.pasosTotales) * 100 : 0;
  const { setPage, empresas } = useApp();

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={() => onDragStart(oferta.id)}
      onClick={() => setPage('oferta-detail', oferta.id)}
    >
      <div className="kanban-card-header">
        <LogoBubble empresa={oferta.empresa} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kanban-card-title">{oferta.titulo}</div>
          <div className="kanban-card-company">{empresas[oferta.empresa]?.nombre ?? oferta.empresa}</div>
        </div>
      </div>

      {oferta.salarioBrutoOfrecido && (
        <div className="kanban-card-salary">
          {oferta.moneda} {oferta.salarioBrutoOfrecido.toLocaleString()}
        </div>
      )}

      <div className="kanban-card-tags">
        {oferta.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="chip" style={{ fontSize: 10.5, padding: '1px 6px' }}>{tag}</span>
        ))}
      </div>

      <div className="kanban-card-footer">
        <div className="step-progress">
          <div className="step-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        {oferta.proximaFecha && (
          <span className="card-date">{oferta.proximaFecha}</span>
        )}
      </div>
    </div>
  );
}

const colColors: Record<string, string> = {
  nueva: 'oklch(0.62 0.012 250)',
  aplicada: 'oklch(0.52 0.20 250)',
  en_proceso: 'oklch(0.74 0.16 70)',
  oferta_recibida: 'oklch(0.70 0.19 155)',
  rechazada_empresa: 'oklch(0.58 0.22 25)',
  ghosted: 'oklch(0.55 0.012 250)',
};

function KanbanView() {
  const { ofertas, moveOferta, showToast } = useApp();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDrop = (col: string) => {
    if (draggingId && col !== (ofertas.find(o => o.id === draggingId)?.estado)) {
      moveOferta(draggingId, col as EstadoOferta);
      showToast(`Oferta movida a ${estadoLabels[col]}`, 'success');
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <div className="kanban-board">
      {kanbanCols.map((col) => {
        const colOfertas = ofertas.filter((o) => o.estado === col);
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
                <KanbanCard key={o.id} oferta={o} onDragStart={(id) => setDraggingId(id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView() {
  const { ofertas, setPage, empresas } = useApp();
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table className="list-table">
        <thead>
          <tr>
            <th>Empresa / Rol</th>
            <th>Estado</th>
            <th>Salario</th>
            <th>Modalidad</th>
            <th>Paso</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {ofertas.map((o) => (
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
              <td style={{ fontSize: 12 }}>{o.pasoActual}/{o.pasosTotales}</td>
              <td style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{o.actualizadoEn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Ofertas() {
  const { ofertas, ofertasView, setOfertasView, setPage } = useApp();
  const [estadoFilter, setEstadoFilter] = useState<string>('todas');

  const filteredOfertas = estadoFilter === 'todas'
    ? ofertas
    : ofertas.filter((o) => o.estado === estadoFilter);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: ofertasView === 'kanban' ? '24px 24px 0' : 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis ofertas <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({ofertas.length})</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <KanbanView />
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
          <ListView />
        </div>
      )}
    </div>
  );
}

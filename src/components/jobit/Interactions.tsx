import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { empresas, kanbanCols, estadoLabels } from './data';
import type { Oferta, EstadoOferta, Modalidad } from './types';

/* ---- TOAST ---- */
export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.variant}`}>
          <Icon
            name={t.variant === 'success' ? 'check' : t.variant === 'warn' ? 'star' : 'sparkles'}
            size={14}
            stroke="white"
          />
          {t.message}
          <button
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: 4, display: 'flex', alignItems: 'center' }}
            onClick={() => dismissToast(t.id)}
          >
            <Icon name="x" size={12} stroke="white" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---- NUEVA OFERTA MODAL ---- */
interface NewOfertaForm {
  titulo: string;
  empresa: string;
  estado: EstadoOferta;
  modalidad: Modalidad;
  proximaFecha: string;
  moneda: string;
  salario: string;
  tags: string;
  descripcion: string;
}

export function NuevaOfertaModal() {
  const { nuevaOpen, setNuevaOpen, addOferta, showToast } = useApp();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<NewOfertaForm>({
    titulo: '',
    empresa: 'globant',
    estado: 'nueva',
    modalidad: 'remoto',
    proximaFecha: '',
    moneda: 'USD',
    salario: '',
    tags: '',
    descripcion: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNuevaOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setNuevaOpen]);

  if (!nuevaOpen) return null;

  const handleSubmit = () => {
    if (!form.titulo.trim()) {
      setError('El título es requerido');
      return;
    }

    const newOferta: Oferta = {
      id: `o-${Date.now()}`,
      titulo: form.titulo,
      empresa: form.empresa,
      estado: form.estado,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      modalidad: form.modalidad,
      tipoEmpleo: 'full-time',
      metodoPago: 'mensual',
      moneda: form.moneda as Oferta['moneda'],
      salarioBrutoOfrecido: form.salario ? Number(form.salario) : null,
      salarioNetoOfrecido: form.salario ? Math.round(Number(form.salario) * 0.8) : null,
      descripcionPuesto: form.descripcion,
      beneficios: [],
      jornada: '40hs/semana',
      pais: empresas[form.empresa]?.pais ?? '',
      ciudad: '',
      contactos: [],
      cvEnviado: null,
      pasoActual: 0,
      pasosTotales: 4,
      proximaFecha: form.proximaFecha || null,
      scoring: 0,
      actualizadoEn: new Date().toISOString().slice(0, 10),
    };

    addOferta(newOferta);
    showToast('Oferta creada correctamente', 'success');
    setNuevaOpen(false);
    setForm({ titulo: '', empresa: 'globant', estado: 'nueva', modalidad: 'remoto', proximaFecha: '', moneda: 'USD', salario: '', tags: '', descripcion: '' });
    setError('');
  };

  const set = (key: keyof NewOfertaForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) setNuevaOpen(false); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Nueva oferta</div>
          <div className="modal-subtitle">Registrá una oferta laboral para hacerle seguimiento</div>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--color-danger-soft)', border: '1px solid oklch(0.58 0.22 25 / 0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'oklch(0.50 0.22 25)' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              className="form-input"
              placeholder="ej. Senior Software Engineer"
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <select className="form-input" value={form.empresa} onChange={(e) => set('empresa', e.target.value)}>
                {Object.values(empresas).map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.estado} onChange={(e) => set('estado', e.target.value as EstadoOferta)}>
                {kanbanCols.map((col) => (
                  <option key={col} value={col}>{estadoLabels[col]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Modalidad</label>
            <div className="segmented">
              {(['remoto', 'hibrido', 'presencial'] as Modalidad[]).map((m) => (
                <button
                  key={m}
                  className={`segmented-btn${form.modalidad === m ? ' active' : ''}`}
                  onClick={() => set('modalidad', m)}
                  type="button"
                  style={{ textTransform: 'capitalize' }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Próxima fecha</label>
              <input className="form-input" type="date" value={form.proximaFecha} onChange={(e) => set('proximaFecha', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Salario bruto</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="form-input" value={form.moneda} onChange={(e) => set('moneda', e.target.value)} style={{ width: 80, flexShrink: 0 }}>
                  <option>USD</option>
                  <option>ARS</option>
                  <option>EUR</option>
                </select>
                <input className="form-input" type="number" placeholder="ej. 5000" value={form.salario} onChange={(e) => set('salario', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (separados por coma)</label>
            <input className="form-input" placeholder="React, TypeScript, Node.js" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" placeholder="Descripción del puesto…" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} rows={4} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setNuevaOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <Icon name="plus" size={14} /> Crear oferta
          </button>
        </div>
      </div>
    </div>
  );
}

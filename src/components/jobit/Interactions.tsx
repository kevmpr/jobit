import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { kanbanCols, estadoLabels } from './data';
import type { Oferta, EstadoOferta } from './types';

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
  modalidad: string;
  fechaInicio: string;
  moneda: string;
  salarioBruto: string;
  salarioNeto: string;
  pretension: string;
  metodoPago: string;
  tags: string;
  descripcion: string;
  tipoEmpleo: string;
  jornada: string;
  pais: string;
  ciudad: string;
}

export function NuevaOfertaModal() {
  const { nuevaOpen, setNuevaOpen, addOferta, showToast, empresas } = useApp();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Derive the first available empresa id from context so the default is always
  // a valid Supabase UUID, not the hardcoded 'globant' static key.
  const firstEmpresaId = Object.keys(empresas)[0] ?? '';

  const [form, setForm] = useState<NewOfertaForm>({
    titulo: '',
    empresa: firstEmpresaId,
    estado: 'recibida',
    modalidad: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    moneda: '',
    salarioBruto: '',
    salarioNeto: '',
    pretension: '',
    metodoPago: '',
    tags: '',
    descripcion: '',
    tipoEmpleo: '',
    jornada: '',
    pais: '',
    ciudad: '',
  });

  // Keep empresa in sync when empresas loads asynchronously (e.g. on first render
  // the map is empty, then fills — we need to set a real id as soon as it arrives).
  useEffect(() => {
    if (form.empresa === '' || !(form.empresa in empresas)) {
      const id = Object.keys(empresas)[0];
      if (id) setForm((prev) => ({ ...prev, empresa: id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresas]);

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
      id: '',
      titulo: form.titulo,
      empresa: form.empresa || '',
      estado: form.estado,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      modalidad: (form.modalidad as Oferta['modalidad']) || null,
      tipoEmpleo: (form.tipoEmpleo as Oferta['tipoEmpleo']) || null,
      metodoPago: (form.metodoPago as Oferta['metodoPago']) || null,
      moneda: (form.moneda as Oferta['moneda']) || null,
      salarioBrutoOfrecido: form.salarioBruto ? Math.round(Number(form.salarioBruto)) : null,
      salarioNetoOfrecido: form.salarioNeto ? Math.round(Number(form.salarioNeto)) : null,
      pretension: form.pretension ? Math.round(Number(form.pretension)) : undefined,
      descripcionPuesto: form.descripcion,
      beneficios: [],
      jornada: form.jornada.trim() || null,
      pais: form.pais.trim() || null,
      ciudad: form.ciudad.trim() || null,
      contactos: [],
      cvEnviado: null,
      pasoActual: 0,
      pasosTotales: 4,
      fechaInicio: form.fechaInicio || null,
      pasos: [],
      scoring: 0,
      actualizadoEn: new Date().toISOString().slice(0, 10),
    };

    addOferta(newOferta);
    showToast('Oferta creada correctamente', 'success');
    setNuevaOpen(false);
    setForm({ titulo: '', empresa: Object.keys(empresas)[0] ?? '', estado: 'recibida', modalidad: '', fechaInicio: new Date().toISOString().split('T')[0], moneda: '', salarioBruto: '', salarioNeto: '', pretension: '', metodoPago: '', tags: '', descripcion: '', tipoEmpleo: '', jornada: '', pais: '', ciudad: '' });
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
                <option value="">Sin empresa</option>
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
            <select className="form-input" value={form.modalidad} onChange={(e) => set('modalidad', e.target.value)}>
              <option value="">Sin especificar</option>
              <option value="remoto">Remoto</option>
              <option value="hibrido">Híbrido</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de inicio</label>
            <input className="form-input" type="date" value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (separados por coma)</label>
            <input className="form-input" placeholder="React, TypeScript, Node.js" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" placeholder="Descripción del puesto…" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} rows={4} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Salario (opcional)
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-input" value={form.moneda} onChange={(e) => set('moneda', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="UYU">UYU</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <select className="form-input" value={form.metodoPago} onChange={(e) => set('metodoPago', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="mensual">Mensual</option>
                  <option value="por_hora">Por hora</option>
                  <option value="por_proyecto">Por proyecto</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Salario bruto ofrecido</label>
                <input className="form-input" type="number" placeholder="Ej: 3000" value={form.salarioBruto} onChange={(e) => set('salarioBruto', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Salario neto estimado</label>
                <input className="form-input" type="number" placeholder="Ej: 2400" value={form.salarioNeto} onChange={(e) => set('salarioNeto', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mi pretensión</label>
              <input className="form-input" type="number" placeholder="Mi expectativa salarial para esta oferta" value={form.pretension} onChange={(e) => set('pretension', e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Más información (opcional)
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tipo de empleo</label>
                <select className="form-input" value={form.tipoEmpleo} onChange={(e) => set('tipoEmpleo', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contrato">Contrato</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jornada</label>
                <input className="form-input" placeholder="Ej: Lunes a viernes 9-18hs" value={form.jornada} onChange={(e) => set('jornada', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">País</label>
                <input className="form-input" placeholder="Ej: Argentina" value={form.pais} onChange={(e) => set('pais', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad</label>
                <input className="form-input" placeholder="Ej: Buenos Aires" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
              </div>
            </div>
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

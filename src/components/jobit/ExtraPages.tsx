import { useState, useEffect, useRef, useCallback, type MouseEvent, type ChangeEvent, type KeyboardEvent, type CSSProperties } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { useIsMobile } from './hooks';
import { addEmpresa as dbAddEmpresa, addContacto as dbAddContacto, updateContacto as dbUpdateContacto, addPlataforma as dbAddPlataforma, uploadCV as dbUploadCV, deleteCV as dbDeleteCV, getCVUrl } from '../../lib/db';
import type { Empresa, Contacto, Plataforma, Experiencia, Educacion, Certificacion, Idioma, PerfilUsuario } from './types';
import { formatDate } from '../../lib/utils';

const COLOR_PRESETS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6B7280'];

/* ---- PERFIL HELPERS ---- */

const NIVELES_IDIOMA: Idioma['nivel'][] = ['básico', 'intermedio', 'avanzado', 'nativo'];
const MONEDAS: PerfilUsuario['moneda'][] = ['ARS', 'USD', 'EUR', 'UYU', 'BRL'];
const METODOS_PAGO: { value: PerfilUsuario['metodoPago']; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'hora', label: 'Por hora' },
  { value: 'proyecto', label: 'Por proyecto' },
];
const MODALIDADES_EXP = ['remoto', 'híbrido', 'presencial'];

/* ---- AVATAR CROPPER ---- */
function AvatarCropper({
  onCrop,
  onCancel,
}: {
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}) {
  // The crop circle always occupies the full container square.
  const CROP_SIZE = 280;

  const [imgSrc, setImgSrc]   = useState<string | null>(null);
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [zoom, setZoom]       = useState(1.0);
  const [minZoom, setMinZoom] = useState(1.0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const imgRef  = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // store natural dimensions so clamp can access them without reading the DOM
  const naturalSize = useRef({ w: 1, h: 1 });

  /** Max offset allowed so the image never reveals empty space inside the circle. */
  const clamp = useCallback((ox: number, oy: number, z: number) => {
    const { w, h } = naturalSize.current;
    const maxX = Math.max(0, (w * z - CROP_SIZE) / 2);
    const maxY = Math.max(0, (h * z - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    };
  }, []);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target?.result as string);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    naturalSize.current = { w: img.naturalWidth, h: img.naturalHeight };
    // Fill: shorter side of image == CROP_SIZE (circle diameter). Use MAX so image covers circle.
    const fill = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    setMinZoom(fill);
    setZoom(fill);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setOffset((prev) => {
      void prev;
      return clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom);
    });
  }, [dragging, zoom, clamp]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleCrop = () => {
    if (!imgSrc || !imgRef.current) return;
    const canvas  = document.createElement('canvas');
    canvas.width  = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d')!;
    const img = imgRef.current;
    const nw  = img.naturalWidth;
    const nh  = img.naturalHeight;
    // Circle is centered at container center. Image center in container = (CROP_SIZE/2 + offset.x, …).
    // Source region top-left in natural pixels:
    //   srcX = nw/2 - CROP_SIZE/(2*zoom) - offset.x/zoom
    const srcX = nw / 2 - CROP_SIZE / (2 * zoom) - offset.x / zoom;
    const srcY = nh / 2 - CROP_SIZE / (2 * zoom) - offset.y / zoom;
    const srcW = CROP_SIZE / zoom;
    const srcH = CROP_SIZE / zoom;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);
    canvas.toBlob((blob) => { if (blob) onCrop(blob); }, 'image/jpeg', 0.92);
  };

  // Slider 0–100 maps to minZoom–3×minZoom
  const maxZoom  = minZoom * 3;
  const sliderVal = minZoom > 0 ? ((zoom - minZoom) / (maxZoom - minZoom)) * 100 : 0;
  const handleSlider = (v: number) => {
    const newZoom = minZoom + (v / 100) * (maxZoom - minZoom);
    setZoom(newZoom);
    // Re-clamp offset for the new zoom level
    setOffset((prev) => clamp(prev.x, prev.y, newZoom));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!imgSrc ? (
        <label style={{ cursor: 'pointer' }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <div style={{
            width: CROP_SIZE, height: CROP_SIZE, borderRadius: 12,
            border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface-muted)',
          }}>
            <Icon name="user" size={32} stroke="var(--text-subtle)" />
            <span>Hacer clic para seleccionar imagen</span>
          </div>
        </label>
      ) : (
        <div
          style={{ position: 'relative', width: CROP_SIZE, height: CROP_SIZE, overflow: 'hidden', borderRadius: 12, cursor: dragging ? 'grabbing' : 'grab', background: '#111', userSelect: 'none' }}
          onMouseDown={handleMouseDown}
        >
          <img
            ref={imgRef}
            src={imgSrc}
            alt="crop preview"
            onLoad={handleImgLoad}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              transformOrigin: 'center',
              width: naturalSize.current.w,
              maxWidth: 'none', maxHeight: 'none',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
          {/* Circular mask — always fills the container */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <svg width={CROP_SIZE} height={CROP_SIZE} style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <mask id="crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <circle cx={CROP_SIZE / 2} cy={CROP_SIZE / 2} r={CROP_SIZE / 2 - 1} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />
              <circle cx={CROP_SIZE / 2} cy={CROP_SIZE / 2} r={CROP_SIZE / 2 - 1} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      )}
      {imgSrc && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Zoom</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(sliderVal)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={sliderVal}
            className="avatar-zoom"
            onChange={(e) => handleSlider(parseFloat(e.target.value))}
            style={{
              width: '100%',
              appearance: 'none',
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${sliderVal}%, #374151 ${sliderVal}%, #374151 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <style>{`
            input[type=range].avatar-zoom::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 16px; height: 16px;
              border-radius: 50%;
              background: #7c3aed;
              border: 2px solid #a78bfa;
              cursor: pointer;
            }
            input[type=range].avatar-zoom::-moz-range-thumb {
              width: 16px; height: 16px;
              border-radius: 50%;
              background: #7c3aed;
              border: 2px solid #a78bfa;
              cursor: pointer;
            }
          `}</style>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Arrastrá para reposicionar · slider para acercar/alejar</div>
        </div>
      )}
      {!imgSrc && <div style={{ fontSize: 12, color: 'var(--text-subtle)' }} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancelar</button>
        {imgSrc && (
          <>
            <label className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              Cambiar
            </label>
            <button className="btn btn-primary" onClick={handleCrop} style={{ flex: 1 }}>Recortar y guardar</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- CHIP INPUT ---- */
function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const tag = input.trim().replace(/,+$/, '');
      if (tag && !value.includes(tag)) onChange([...value, tag]);
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 10px', background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 8, minHeight: 40, alignItems: 'center' }}>
      {value.map((chip) => (
        <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--color-brand-light)', border: '1px solid var(--color-brand)', borderRadius: 20, padding: '2px 10px', fontSize: 12.5, color: 'var(--text)' }}>
          {chip}
          <button type="button" onClick={() => onChange(value.filter((c) => c !== chip))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
            <Icon name="x" size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, flex: 1, minWidth: 80 }}
      />
    </div>
  );
}

/* ---- EXPERIENCIA MODAL ---- */
const EMPTY_EXP: Omit<Experiencia, 'id'> = {
  empresa: '', rol: '', fechaInicio: '', fechaFin: '', actual: false, modalidad: '', descripcion: '',
};

function ExperienciaModal({
  open, onClose, initial, expId,
  onAdd, onUpdate,
}: {
  open: boolean; onClose: () => void;
  initial?: Experiencia; expId?: string;
  onAdd: (data: Omit<Experiencia, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Experiencia>) => Promise<void>;
}) {
  const isEdit = !!expId;
  const [form, setForm] = useState<Omit<Experiencia, 'id'>>(EMPTY_EXP);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        const { id: _id, ...rest } = initial;
        setForm({ ...EMPTY_EXP, ...rest });
      } else {
        setForm(EMPTY_EXP);
      }
      setError('');
    }
  }, [open, initial]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!open) return null;

  const set = (key: keyof typeof form, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!form.empresa.trim() || !form.rol.trim()) { setError('Empresa y rol son requeridos'); return; }
    setSaving(true);
    try {
      if (isEdit && expId) await onUpdate(expId, form);
      else await onAdd(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Editar experiencia' : 'Agregar experiencia'}</div>
        </div>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--color-danger-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'oklch(0.50 0.22 25)', marginBottom: 4 }}>{error}</div>}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Empresa *</label>
              <input className="form-input" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="ej. Mercado Libre" />
            </div>
            <div className="form-group">
              <label className="form-label">Rol *</label>
              <input className="form-input" value={form.rol} onChange={(e) => set('rol', e.target.value)} placeholder="ej. Frontend Developer" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Fecha inicio</label>
              <input className="form-input" type="date" value={form.fechaInicio ?? ''} onChange={(e) => set('fechaInicio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha fin</label>
              <input className="form-input" type="date" value={form.fechaFin ?? ''} onChange={(e) => set('fechaFin', e.target.value)} disabled={form.actual} />
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="exp-actual" checked={form.actual} onChange={(e) => set('actual', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="exp-actual" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Trabajo actual</label>
          </div>
          <div className="form-group">
            <label className="form-label">Modalidad</label>
            <select className="form-input" value={form.modalidad ?? ''} onChange={(e) => set('modalidad', e.target.value)}>
              <option value="">Sin especificar</option>
              {MODALIDADES_EXP.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" rows={3} value={form.descripcion ?? ''} onChange={(e) => set('descripcion', e.target.value)} placeholder="Responsabilidades, logros, tecnologías usadas…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- EDUCACION MODAL ---- */
const EMPTY_EDU: Omit<Educacion, 'id'> = {
  instituto: '', titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', actual: false,
};

function EducacionModal({
  open, onClose, initial, eduId,
  onAdd, onUpdate,
}: {
  open: boolean; onClose: () => void;
  initial?: Educacion; eduId?: string;
  onAdd: (data: Omit<Educacion, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Educacion>) => Promise<void>;
}) {
  const isEdit = !!eduId;
  const [form, setForm] = useState<Omit<Educacion, 'id'>>(EMPTY_EDU);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        const { id: _id, ...rest } = initial;
        setForm({ ...EMPTY_EDU, ...rest });
      } else {
        setForm(EMPTY_EDU);
      }
      setError('');
    }
  }, [open, initial]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!open) return null;

  const set = (key: keyof typeof form, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!form.instituto.trim() || !form.titulo.trim()) { setError('Instituto y título son requeridos'); return; }
    setSaving(true);
    try {
      if (isEdit && eduId) await onUpdate(eduId, form);
      else await onAdd(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Editar educación' : 'Agregar educación'}</div>
        </div>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--color-danger-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'oklch(0.50 0.22 25)', marginBottom: 4 }}>{error}</div>}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Instituto *</label>
              <input className="form-input" value={form.instituto} onChange={(e) => set('instituto', e.target.value)} placeholder="ej. UBA" />
            </div>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input className="form-input" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="ej. Licenciatura en Sistemas" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Fecha inicio</label>
              <input className="form-input" type="date" value={form.fechaInicio ?? ''} onChange={(e) => set('fechaInicio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha fin</label>
              <input className="form-input" type="date" value={form.fechaFin ?? ''} onChange={(e) => set('fechaFin', e.target.value)} disabled={form.actual} />
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="edu-actual" checked={form.actual} onChange={(e) => set('actual', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="edu-actual" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Cursando actualmente</label>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" rows={3} value={form.descripcion ?? ''} onChange={(e) => set('descripcion', e.target.value)} placeholder="Especialización, materias destacadas…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- SECTION HEADER ---- */
function SectionHeader({ title, onAdd, addLabel }: { title: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
      {onAdd && (
        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={onAdd}>
          <Icon name="plus" size={13} /> {addLabel ?? 'Agregar'}
        </button>
      )}
    </div>
  );
}

/* ---- PERFIL ---- */
export function Perfil() {
  const {
    perfil, currentUser,
    updatePerfil, updateAvatar,
    experiencia, educacion,
    addExperiencia, updateExperiencia: storeUpdateExperiencia, deleteExperiencia,
    addEducacion, updateEducacion: storeUpdateEducacion, deleteEducacion,
    showToast,
  } = useApp();

  const isMobile = useIsMobile();
  const p = perfil;

  // Compute avatar initials
  const avatarInitials = (() => {
    const nombre = p?.nombre?.trim();
    const apellido = p?.apellido?.trim();
    if (nombre || apellido) {
      const parts = [nombre, apellido].filter(Boolean);
      return parts.map((w) => w![0]).join('').toUpperCase().slice(0, 2);
    }
    const email = currentUser?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  })();

  // --- Tabs ---
  const TABS = ['Información', 'Salario', 'Habilidades', 'Experiencia', 'Educación', 'Certificaciones', 'Exportar'] as const;
  type Tab = typeof TABS[number];
  const [activeTab, setActiveTab] = useState<Tab>('Información');

  // --- Avatar ---
  const [showCropper, setShowCropper] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleCrop = async (blob: Blob) => {
    setShowCropper(false);
    setAvatarUploading(true);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await updateAvatar(file);
      showToast('Avatar actualizado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al subir el avatar', 'warn');
    } finally {
      setAvatarUploading(false);
    }
  };

  // --- Info personal form ---
  const [infoForm, setInfoForm] = useState({
    nombre: p?.nombre ?? '',
    apellido: p?.apellido ?? '',
    linkedin: p?.linkedin ?? '',
    github: p?.github ?? '',
    ubicacion: p?.ubicacion ?? '',
    rol: p?.rol ?? '',
    empresa: p?.empresa ?? '',
    sobreMi: p?.sobreMi ?? '',
    emailContacto: p?.emailContacto ?? '',
  });
  const [infoSaving, setInfoSaving] = useState(false);

  useEffect(() => {
    if (p) {
      setInfoForm({
        nombre: p.nombre ?? '',
        apellido: p.apellido ?? '',
        linkedin: p.linkedin ?? '',
        github: p.github ?? '',
        ubicacion: p.ubicacion ?? '',
        rol: p.rol ?? '',
        empresa: p.empresa ?? '',
        sobreMi: p.sobreMi ?? '',
        emailContacto: p.emailContacto ?? '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.nombre, p?.apellido, p?.linkedin, p?.github, p?.ubicacion, p?.rol, p?.empresa, p?.sobreMi, p?.emailContacto]);

  const handleInfoSave = async () => {
    setInfoSaving(true);
    try {
      await updatePerfil(infoForm);
      showToast('Información guardada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'warn');
    } finally {
      setInfoSaving(false);
    }
  };

  // --- Salario form ---
  const [salarioForm, setSalarioForm] = useState({
    salarioBruto: p?.salarioBruto ?? 0,
    salarioNeto: p?.salarioNeto ?? 0,
    moneda: p?.moneda ?? ('USD' as PerfilUsuario['moneda']),
    metodoPago: p?.metodoPago ?? ('mensual' as PerfilUsuario['metodoPago']),
  });
  const [salarioSaving, setSalarioSaving] = useState(false);

  useEffect(() => {
    if (p) {
      setSalarioForm({
        salarioBruto: p.salarioBruto ?? 0,
        salarioNeto: p.salarioNeto ?? 0,
        moneda: p.moneda ?? 'USD',
        metodoPago: p.metodoPago ?? 'mensual',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.salarioBruto, p?.salarioNeto, p?.moneda, p?.metodoPago]);

  const handleSalarioSave = async () => {
    setSalarioSaving(true);
    try {
      await updatePerfil(salarioForm);
      showToast('Salario guardado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'warn');
    } finally {
      setSalarioSaving(false);
    }
  };

  // --- Habilidades ---
  const [stack, setStack] = useState<string[]>(p?.stack ?? []);
  const [habilidadesBlandas, setHabilidadesBlandas] = useState<string[]>(p?.habilidadesBlandas ?? []);
  const [idiomas, setIdiomas] = useState<Idioma[]>(p?.idiomas ?? []);
  const [nuevoIdioma, setNuevoIdioma] = useState<Idioma>({ nombre: '', nivel: 'básico' });
  const [habSaving, setHabSaving] = useState(false);

  useEffect(() => {
    if (p) {
      setStack(p.stack ?? []);
      setHabilidadesBlandas(p.habilidadesBlandas ?? []);
      setIdiomas(p.idiomas ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.stack, p?.habilidadesBlandas, p?.idiomas]);

  const handleHabSave = async () => {
    setHabSaving(true);
    try {
      await updatePerfil({ stack, habilidadesBlandas, idiomas });
      showToast('Habilidades guardadas', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'warn');
    } finally {
      setHabSaving(false);
    }
  };

  const addIdioma = () => {
    if (!nuevoIdioma.nombre.trim()) return;
    setIdiomas((prev) => [...prev, { ...nuevoIdioma }]);
    setNuevoIdioma({ nombre: '', nivel: 'básico' });
  };

  const removeIdioma = (idx: number) => setIdiomas((prev) => prev.filter((_, i) => i !== idx));

  // --- Experiencia modal ---
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editExpId, setEditExpId] = useState<string | null>(null);
  const editExp = editExpId ? experiencia.find((e) => e.id === editExpId) : undefined;
  const [confirmDeleteExp, setConfirmDeleteExp] = useState<Record<string, boolean>>({});

  const handleDeleteExp = (id: string) => {
    setConfirmDeleteExp((p) => ({ ...p, [id]: true }));
    setTimeout(() => setConfirmDeleteExp((p) => ({ ...p, [id]: false })), 3000);
  };
  const handleDeleteExpConfirm = async (id: string) => {
    setConfirmDeleteExp((p) => ({ ...p, [id]: false }));
    try {
      await deleteExperiencia(id);
      showToast('Experiencia eliminada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'warn');
    }
  };

  // --- Educacion modal ---
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editEduId, setEditEduId] = useState<string | null>(null);
  const editEdu = editEduId ? educacion.find((e) => e.id === editEduId) : undefined;
  const [confirmDeleteEdu, setConfirmDeleteEdu] = useState<Record<string, boolean>>({});

  const handleDeleteEdu = (id: string) => {
    setConfirmDeleteEdu((p) => ({ ...p, [id]: true }));
    setTimeout(() => setConfirmDeleteEdu((p) => ({ ...p, [id]: false })), 3000);
  };
  const handleDeleteEduConfirm = async (id: string) => {
    setConfirmDeleteEdu((p) => ({ ...p, [id]: false }));
    try {
      await deleteEducacion(id);
      showToast('Educación eliminada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'warn');
    }
  };

  // --- Certificaciones ---
  const [certs, setCerts] = useState<Certificacion[]>(p?.certificaciones ?? []);
  const [certForm, setCertForm] = useState<Omit<Certificacion, 'id'>>({ titulo: '', emisor: '', fecha: '', url: '' });
  const [certFormOpen, setCertFormOpen] = useState(false);
  const [certSaving, setCertSaving] = useState(false);
  const [confirmDeleteCert, setConfirmDeleteCert] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (p) setCerts(p.certificaciones ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.certificaciones]);

  const handleAddCert = async () => {
    if (!certForm.titulo.trim()) return;
    const newCert: Certificacion = { id: crypto.randomUUID(), ...certForm };
    const newCerts = [...certs, newCert];
    setCertSaving(true);
    try {
      await updatePerfil({ certificaciones: newCerts });
      setCerts(newCerts);
      setCertForm({ titulo: '', emisor: '', fecha: '', url: '' });
      setCertFormOpen(false);
      showToast('Certificación agregada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'warn');
    } finally {
      setCertSaving(false);
    }
  };

  const handleDeleteCert = (id: string) => {
    setConfirmDeleteCert((p) => ({ ...p, [id]: true }));
    setTimeout(() => setConfirmDeleteCert((p) => ({ ...p, [id]: false })), 3000);
  };

  const handleDeleteCertConfirm = async (id: string) => {
    setConfirmDeleteCert((p) => ({ ...p, [id]: false }));
    const newCerts = certs.filter((c) => c.id !== id);
    try {
      await updatePerfil({ certificaciones: newCerts });
      setCerts(newCerts);
      showToast('Certificación eliminada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'warn');
    }
  };

  const cardStyle: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 };
  const rowMeta: CSSProperties = { fontSize: 12, color: 'var(--text-subtle)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' };

  return (
    <div className="page-content">
      {/* Sticky header with avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {p?.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt="avatar"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
            />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'oklch(0.30 0.10 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--text)', border: '2px solid var(--border)' }}>
              {avatarInitials}
            </div>
          )}
          <button
            onClick={() => setShowCropper(true)}
            disabled={avatarUploading}
            style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: 'var(--color-brand)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {avatarUploading ? (
              <div style={{ width: 10, height: 10, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <Icon name="edit" size={10} stroke="white" />
            )}
          </button>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {p?.nombre || p?.apellido ? `${p?.nombre ?? ''} ${p?.apellido ?? ''}`.trim() : currentUser?.email ?? 'Mi perfil'}
          </div>
          {(p?.rol || p?.empresa) && (
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {[p?.rol, p?.empresa].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>

      {/* Avatar cropper modal */}
      {showCropper && (
        <div className="modal-backdrop" onClick={(e) => { if (e.currentTarget === e.target) setShowCropper(false); }}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">Cambiar foto de perfil</div>
            </div>
            <div className="modal-body">
              <AvatarCropper onCrop={handleCrop} onCancel={() => setShowCropper(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', fontSize: 13.5, fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? 'var(--color-brand)' : 'var(--text-muted)',
              background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--color-brand)' : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---- TAB: INFORMACIÓN ---- */}
      {activeTab === 'Información' && (
        <div style={{ maxWidth: 640 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={infoForm.nombre} onChange={(e) => setInfoForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Juan" />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input className="form-input" value={infoForm.apellido} onChange={(e) => setInfoForm((f) => ({ ...f, apellido: e.target.value }))} placeholder="Pérez" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Email</label>
                <input className="form-input" value={currentUser?.email ?? ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Email de contacto</label>
                <input className="form-input" value={infoForm.emailContacto} onChange={(e) => setInfoForm((f) => ({ ...f, emailContacto: e.target.value }))} placeholder="tu@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn</label>
                <input className="form-input" value={infoForm.linkedin} onChange={(e) => setInfoForm((f) => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub</label>
                <input className="form-input" value={infoForm.github} onChange={(e) => setInfoForm((f) => ({ ...f, github: e.target.value }))} placeholder="https://github.com/..." />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Ubicación</label>
                <input className="form-input" value={infoForm.ubicacion} onChange={(e) => setInfoForm((f) => ({ ...f, ubicacion: e.target.value }))} placeholder="ej. Buenos Aires, Argentina" />
              </div>
              <div className="form-group">
                <label className="form-label">Rol actual</label>
                <input className="form-input" value={infoForm.rol} onChange={(e) => setInfoForm((f) => ({ ...f, rol: e.target.value }))} placeholder="ej. Frontend Developer" />
              </div>
              <div className="form-group">
                <label className="form-label">Empresa actual</label>
                <input className="form-input" value={infoForm.empresa} onChange={(e) => setInfoForm((f) => ({ ...f, empresa: e.target.value }))} placeholder="ej. Mercado Libre" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Sobre mí</label>
                <textarea className="form-input" rows={4} value={infoForm.sobreMi} onChange={(e) => setInfoForm((f) => ({ ...f, sobreMi: e.target.value }))} placeholder="Breve descripción sobre vos, tu perfil profesional y lo que buscás…" style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleInfoSave} disabled={infoSaving}>
                {infoSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: SALARIO ---- */}
      {activeTab === 'Salario' && (
        <div style={{ maxWidth: 540 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Salario bruto</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={salarioForm.salarioBruto || ''}
                  onChange={(e) => setSalarioForm((f) => ({ ...f, salarioBruto: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Salario neto</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={salarioForm.salarioNeto || ''}
                  onChange={(e) => setSalarioForm((f) => ({ ...f, salarioNeto: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-input" value={salarioForm.moneda} onChange={(e) => setSalarioForm((f) => ({ ...f, moneda: e.target.value as PerfilUsuario['moneda'] }))}>
                  {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <select className="form-input" value={salarioForm.metodoPago} onChange={(e) => setSalarioForm((f) => ({ ...f, metodoPago: e.target.value as PerfilUsuario['metodoPago'] }))}>
                  {METODOS_PAGO.map((mp) => <option key={mp.value} value={mp.value}>{mp.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSalarioSave} disabled={salarioSaving}>
                {salarioSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: HABILIDADES ---- */}
      {activeTab === 'Habilidades' && (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Habilidades técnicas (stack)</h3>
            <ChipInput value={stack} onChange={setStack} placeholder="Escribir tecnología y presionar Enter…" />
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Habilidades blandas</h3>
            <ChipInput value={habilidadesBlandas} onChange={setHabilidadesBlandas} placeholder="ej. Liderazgo, Comunicación…" />
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Idiomas</h3>
            </div>
            {idiomas.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Sin idiomas registrados.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {idiomas.map((id, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-muted)', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>{id.nombre}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 8px', textTransform: 'capitalize' }}>{id.nivel}</span>
                  <button className="btn btn-ghost" style={{ padding: '3px 6px', color: 'var(--text-subtle)' }} onClick={() => removeIdioma(idx)}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
            {/* Add idioma row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="ej. Inglés"
                value={nuevoIdioma.nombre}
                onChange={(e) => setNuevoIdioma((n) => ({ ...n, nombre: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') addIdioma(); }}
              />
              <select className="form-input" style={{ width: 130 }} value={nuevoIdioma.nivel} onChange={(e) => setNuevoIdioma((n) => ({ ...n, nivel: e.target.value as Idioma['nivel'] }))}>
                {NIVELES_IDIOMA.map((nv) => <option key={nv} value={nv} style={{ textTransform: 'capitalize' }}>{nv}</option>)}
              </select>
              <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={addIdioma}>
                <Icon name="plus" size={14} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleHabSave} disabled={habSaving}>
              {habSaving ? 'Guardando…' : 'Guardar habilidades'}
            </button>
          </div>
        </div>
      )}

      {/* ---- TAB: EXPERIENCIA ---- */}
      {activeTab === 'Experiencia' && (() => {
        // Duration helper
        const calcDuration = (inicio?: string, fin?: string, actual?: boolean): string => {
          if (!inicio) return '';
          const start = new Date(inicio);
          if (isNaN(start.getTime())) return '';
          const end = actual ? new Date() : fin ? new Date(fin) : null;
          if (!end || isNaN(end.getTime())) return '';
          const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          if (totalMonths < 1) return '< 1 mes';
          if (totalMonths < 12) return `${totalMonths} mes${totalMonths === 1 ? '' : 'es'}`;
          const y = Math.floor(totalMonths / 12);
          const m = totalMonths % 12;
          return m === 0 ? `${y} año${y === 1 ? '' : 's'}` : `${y} año${y === 1 ? '' : 's'} ${m} mes${m === 1 ? '' : 'es'}`;
        };

        // Group by empresa (case-insensitive), preserving original name
        const groupMap = new Map<string, Experiencia[]>();
        for (const exp of experiencia) {
          const key = exp.empresa.trim().toLowerCase();
          if (!groupMap.has(key)) groupMap.set(key, []);
          groupMap.get(key)!.push(exp);
        }

        // Sort roles within each group by start date desc, then sort groups by latest role
        const groups = Array.from(groupMap.values()).map((exps) => {
          const sorted = [...exps].sort((a, b) => (b.fechaInicio ?? '').localeCompare(a.fechaInicio ?? ''));
          // Roles activos primero dentro del grupo, luego por fechaInicio desc
          const sortedFinal = [...exps].sort((a, b) => {
            if (a.actual && !b.actual) return -1;
            if (!a.actual && b.actual) return 1;
            return (b.fechaInicio ?? '').localeCompare(a.fechaInicio ?? '');
          });
          // Empresa con rol activo → poner al tope del timeline
          const hasActual = exps.some(e => e.actual);
          return { empresa: sortedFinal[0].empresa, exps: sortedFinal, latestDate: hasActual ? '9999-99' : (sortedFinal[0].fechaInicio ?? '') };
        }).sort((a, b) => b.latestDate.localeCompare(a.latestDate));

        return (
          <div style={{ maxWidth: 640 }}>
            <SectionHeader title="Experiencia laboral" onAdd={() => { setEditExpId(null); setExpModalOpen(true); }} addLabel="Agregar" />
            {experiencia.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                Sin experiencia laboral registrada.
              </div>
            )}
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              {/* Vertical timeline line */}
              {groups.length > 0 && (
                <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, background: 'var(--border-strong)', borderRadius: 1 }} />
              )}

              {groups.map((group, gi) => {
                // Total duration at this company
                const allDates = group.exps.flatMap(e => [e.fechaInicio, e.actual ? new Date().toISOString() : e.fechaFin].filter(Boolean) as string[]);
                const earliest = allDates.reduce((a, b) => a < b ? a : b, allDates[0] ?? '');
                const latest = group.exps.some(e => e.actual) ? new Date().toISOString() : allDates.reduce((a, b) => a > b ? a : b, allDates[0] ?? '');
                const totalDur = calcDuration(earliest, latest, group.exps.some(e => e.actual));

                return (
                  <div key={group.empresa + gi} style={{ marginBottom: gi < groups.length - 1 ? 28 : 0 }}>
                    {/* Company header node */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
                      {/* Big dot */}
                      <div style={{
                        position: 'absolute', left: -28, width: 20, height: 20,
                        borderRadius: '50%', background: 'var(--color-brand)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, zIndex: 1,
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{group.empresa}</div>
                      {totalDur && (
                        <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 20, padding: '1px 8px', marginLeft: 4 }}>
                          {totalDur} total
                        </span>
                      )}
                    </div>

                    {/* Roles within this company */}
                    <div style={{ borderLeft: '2px solid var(--color-brand-light)', marginLeft: 2, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {group.exps.map((exp) => {
                        const confirming = confirmDeleteExp[exp.id] ?? false;
                        const dur = calcDuration(exp.fechaInicio, exp.fechaFin, exp.actual);
                        return (
                          <div key={exp.id} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', position: 'relative' }}>
                            {/* Small dot on the branch line */}
                            <div style={{ position: 'absolute', left: -22, top: 16, width: 10, height: 10, borderRadius: '50%', background: 'var(--surface-raised)', border: '2px solid var(--color-brand)', zIndex: 1 }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{exp.rol}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                  {exp.fechaInicio && (
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                      {formatDate(exp.fechaInicio)} — {exp.actual ? 'Presente' : formatDate(exp.fechaFin)}
                                    </span>
                                  )}
                                  {dur && (
                                    <span style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'var(--surface-muted)', borderRadius: 20, padding: '1px 7px', border: '1px solid var(--border)' }}>
                                      {dur}
                                    </span>
                                  )}
                                  {exp.modalidad && (
                                    <span style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'var(--surface-muted)', borderRadius: 20, padding: '1px 7px', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                                      {exp.modalidad}
                                    </span>
                                  )}
                                </div>
                                {exp.descripcion && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>{exp.descripcion}</div>}
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                {confirming ? (
                                  <>
                                    <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }} onClick={() => handleDeleteExpConfirm(exp.id)}>¿Confirmar?</button>
                                    <button className="btn btn-ghost" style={{ padding: '3px 6px', height: 'auto' }} onClick={() => setConfirmDeleteExp((p) => ({ ...p, [exp.id]: false }))}><Icon name="x" size={11} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button className="btn btn-ghost" style={{ padding: '4px 6px', height: 'auto' }} onClick={() => { setEditExpId(exp.id); setExpModalOpen(true); }}><Icon name="edit" size={13} /></button>
                                    <button className="btn btn-ghost" style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }} onClick={() => handleDeleteExp(exp.id)}><Icon name="trash" size={13} /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ---- TAB: EDUCACIÓN ---- */}
      {activeTab === 'Educación' && (
        <div style={{ maxWidth: 640 }}>
          <SectionHeader title="Educación" onAdd={() => { setEditEduId(null); setEduModalOpen(true); }} addLabel="Agregar" />
          {educacion.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
              Sin educación registrada.
            </div>
          )}
          {[...educacion].sort((a, b) => {
            if (a.actual && !b.actual) return -1;
            if (!a.actual && b.actual) return 1;
            return (b.fechaInicio ?? '').localeCompare(a.fechaInicio ?? '');
          }).map((edu) => {
            const confirming = confirmDeleteEdu[edu.id] ?? false;
            return (
              <div key={edu.id} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{edu.titulo}</div>
                    <div style={{ fontSize: 13, color: 'oklch(0.52 0.20 250)', fontWeight: 500 }}>{edu.instituto}</div>
                    <div style={rowMeta}>
                      {edu.fechaInicio && <span>{formatDate(edu.fechaInicio)} — {edu.actual ? 'Presente' : formatDate(edu.fechaFin)}</span>}
                    </div>
                    {edu.descripcion && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>{edu.descripcion}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 10 }}>
                    {confirming ? (
                      <>
                        <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }} onClick={() => handleDeleteEduConfirm(edu.id)}>¿Confirmar?</button>
                        <button className="btn btn-ghost" style={{ padding: '3px 6px', height: 'auto' }} onClick={() => setConfirmDeleteEdu((p) => ({ ...p, [edu.id]: false }))}><Icon name="x" size={11} /></button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost" style={{ padding: '4px 6px', height: 'auto' }} onClick={() => { setEditEduId(edu.id); setEduModalOpen(true); }}><Icon name="edit" size={13} /></button>
                        <button className="btn btn-ghost" style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }} onClick={() => handleDeleteEdu(edu.id)}><Icon name="trash" size={13} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- TAB: CERTIFICACIONES ---- */}
      {activeTab === 'Certificaciones' && (
        <div style={{ maxWidth: 640 }}>
          <SectionHeader title="Certificaciones" onAdd={() => setCertFormOpen((v) => !v)} addLabel={certFormOpen ? 'Cancelar' : 'Agregar'} />

          {/* Inline add form */}
          {certFormOpen && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Título *</label>
                  <input className="form-input" value={certForm.titulo} onChange={(e) => setCertForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="ej. AWS Certified Developer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Emisor</label>
                  <input className="form-input" value={certForm.emisor ?? ''} onChange={(e) => setCertForm((f) => ({ ...f, emisor: e.target.value }))} placeholder="ej. Amazon" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" value={certForm.fecha ?? ''} onChange={(e) => setCertForm((f) => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">URL de verificación</label>
                  <input className="form-input" type="url" value={certForm.url ?? ''} onChange={(e) => setCertForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setCertFormOpen(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleAddCert} disabled={certSaving || !certForm.titulo.trim()}>
                  {certSaving ? 'Guardando…' : 'Agregar certificación'}
                </button>
              </div>
            </div>
          )}

          {certs.length === 0 && !certFormOpen && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
              Sin certificaciones registradas.
            </div>
          )}
          {[...certs].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '')).map((cert) => {
            const confirming = confirmDeleteCert[cert.id] ?? false;
            return (
              <div key={cert.id} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}><Icon name="award" size={20} stroke="oklch(0.70 0.19 155)" /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{cert.titulo}</div>
                      {cert.emisor && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{cert.emisor}</div>}
                      {cert.fecha && <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 3 }}>{formatDate(cert.fecha)}</div>}
                      {cert.url && (
                        <a href={cert.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'oklch(0.52 0.20 250)', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                          <Icon name="link" size={11} stroke="oklch(0.52 0.20 250)" /> Ver certificado
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 10 }}>
                    {confirming ? (
                      <>
                        <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }} onClick={() => handleDeleteCertConfirm(cert.id)}>¿Confirmar?</button>
                        <button className="btn btn-ghost" style={{ padding: '3px 6px', height: 'auto' }} onClick={() => setConfirmDeleteCert((p) => ({ ...p, [cert.id]: false }))}><Icon name="x" size={11} /></button>
                      </>
                    ) : (
                      <button className="btn btn-ghost" style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }} onClick={() => handleDeleteCert(cert.id)}><Icon name="trash" size={13} /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Exportar' && (() => {
        // ---- Build CV HTML (Harvard-style, print-ready) ----
        const buildCvHtml = (): string => {
          const nombre = [p?.nombre, p?.apellido].filter(Boolean).join(' ') || 'Sin nombre';
          const rol = p?.rol ?? '';
          const contactParts: string[] = [];
          if (p?.ubicacion) contactParts.push(p.ubicacion);
          if (p?.emailContacto) contactParts.push(p.emailContacto);
          if (p?.linkedin) contactParts.push(p.linkedin);
          if (p?.github) contactParts.push(p.github);
          const contactLine = contactParts.join(' · ');

          const sortedExp = [...experiencia].sort((a, b) => {
            const da = a.actual ? '9999' : (a.fechaFin ?? a.fechaInicio ?? '');
            const db = b.actual ? '9999' : (b.fechaFin ?? b.fechaInicio ?? '');
            return db.localeCompare(da);
          });
          const sortedEdu = [...educacion].sort((a, b) => {
            const da = a.actual ? '9999' : (a.fechaFin ?? a.fechaInicio ?? '');
            const db = b.actual ? '9999' : (b.fechaFin ?? b.fechaInicio ?? '');
            return db.localeCompare(da);
          });
          const sortedCerts = [...certs].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));

          const fmtDates = (inicio?: string, fin?: string, actual?: boolean) => {
            const s = inicio ? formatDate(inicio) : '';
            const e = actual ? 'Presente' : (fin ? formatDate(fin) : '');
            if (s && e) return `${s} – ${e}`;
            if (s) return s;
            return '';
          };

          const sectionHdr = (title: string) =>
            `<h2 style="font-size:12pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-bottom:1.5px solid #000;padding-bottom:2px;margin:18px 0 8px">${title}</h2>`;

          let expFirst = '';
          let expRest = '';
          sortedExp.forEach((e, i) => {
            const dates = fmtDates(e.fechaInicio, e.fechaFin, e.actual);
            const entryHtml = `<div style="margin-bottom:12px;page-break-inside:avoid;break-inside:avoid">
              <div style="display:flex;justify-content:space-between;align-items:baseline">
                <span style="font-weight:bold;font-size:11pt">${e.rol} | ${e.empresa}</span>
                ${dates ? `<span style="font-size:10pt;white-space:nowrap">${dates}</span>` : ''}
              </div>
              ${e.modalidad ? `<div style="font-size:9.5pt;color:#444;margin-top:1px">${e.modalidad}</div>` : ''}
              ${e.descripcion ? `<ul style="margin:4px 0 0 16px;padding:0;font-size:10.5pt">${e.descripcion.split('\n').filter(Boolean).map((l) => `<li style="margin-bottom:2px">${l.replace(/^[-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
            </div>`;
            if (i === 0) expFirst = entryHtml;
            else expRest += entryHtml;
          });
          const expSection = sortedExp.length === 0 ? '' :
            `<div style="break-inside:avoid;page-break-inside:avoid">${sectionHdr('Experiencia')}${expFirst}</div>${expRest}`;

          let eduFirst = '';
          let eduRest = '';
          sortedEdu.forEach((ed, i) => {
            const dates = fmtDates(ed.fechaInicio, ed.fechaFin, ed.actual);
            const entryHtml = `<div style="margin-bottom:10px;page-break-inside:avoid;break-inside:avoid">
              <div style="display:flex;justify-content:space-between;align-items:baseline">
                <span style="font-weight:bold;font-size:11pt">${ed.titulo} | ${ed.instituto}</span>
                ${dates ? `<span style="font-size:10pt;white-space:nowrap">${dates}</span>` : ''}
              </div>
              ${ed.descripcion ? `<p style="font-size:10.5pt;margin:4px 0 0">${ed.descripcion}</p>` : ''}
            </div>`;
            if (i === 0) eduFirst = entryHtml;
            else eduRest += entryHtml;
          });
          const eduSection = sortedEdu.length === 0 ? '' :
            `<div style="break-inside:avoid;page-break-inside:avoid">${sectionHdr('Educación')}${eduFirst}</div>${eduRest}`;

          let certSection = '';
          if (sortedCerts.length > 0) {
            const certListHtml = `<ul style="margin:4px 0 0 16px;padding:0;font-size:10.5pt">${sortedCerts.map((c) => `<li style="margin-bottom:3px;page-break-inside:avoid;break-inside:avoid"><strong>${c.titulo}</strong>${c.emisor ? ` — ${c.emisor}` : ''}${c.fecha ? ` (${formatDate(c.fecha)})` : ''}</li>`).join('')}</ul>`;
            certSection = `<div style="break-inside:avoid;page-break-inside:avoid">${sectionHdr('Certificaciones')}${certListHtml}</div>`;
          }

          const skillsHtml = [
            p?.stack?.length ? `<div style="margin-bottom:4px"><strong>Técnicas:</strong> ${p.stack.join(', ')}</div>` : '',
            p?.habilidadesBlandas?.length ? `<div style="margin-bottom:4px"><strong>Blandas:</strong> ${p.habilidadesBlandas.join(', ')}</div>` : '',
            p?.idiomas?.length ? `<div><strong>Idiomas:</strong> ${p.idiomas.map((i) => `${i.nombre} (${i.nivel})`).join(', ')}</div>` : '',
          ].filter(Boolean).join('');

          const scriptClose = '</' + 'script>';
          return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title> </title>
            <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js">${scriptClose}
            <script>
              try {
                class PrintHandler extends Paged.Handler {
                  afterRendered() { setTimeout(function(){ window.print(); }, 150); }
                }
                Paged.registerHandlers(PrintHandler);
              } catch(e) {
                window.addEventListener('load', function(){ window.print(); });
              }
            ${scriptClose}
            <style>
              @page{size:A4;margin:15mm 20mm}
              body{font-family:'Times New Roman',Georgia,serif;font-size:11pt;color:#000;background:#fff;margin:0;padding:0}
              *{box-sizing:border-box}
              h1{font-size:18pt;font-weight:bold;margin:0 0 4px}
              h2{page-break-after:avoid;break-after:avoid}
              ul{page-break-inside:avoid}
            </style></head><body>
            <div style="text-align:center;margin-bottom:20px">
              <h1>${nombre}</h1>
              ${rol ? `<div style="font-size:12pt;margin-bottom:6px">${rol}</div>` : ''}
              ${contactLine ? `<div style="font-size:10pt;color:#333">${contactLine}</div>` : ''}
            </div>
            ${p?.sobreMi ? `<hr style="border:none;border-top:1px solid #ccc;margin:10px 0 8px"/><p style="font-size:10.5pt;margin:0 0 4px;line-height:1.5">${p.sobreMi}</p>` : ''}
            ${expSection}
            ${eduSection}
            ${certSection}
            ${skillsHtml ? `<div style="break-inside:avoid;page-break-inside:avoid">${sectionHdr('Habilidades')}<div style="font-size:10.5pt">${skillsHtml}</div></div>` : ''}
          </body></html>`;
        };

        // ---- Build Markdown ----
        const buildMarkdown = (): string => {
          const nombre = [p?.nombre, p?.apellido].filter(Boolean).join(' ') || 'Sin nombre';
          const rol = p?.rol ?? '';
          const ubicacion = p?.ubicacion ?? '';

          const sortedExp = [...experiencia].sort((a, b) => {
            const da = a.actual ? '9999' : (a.fechaFin ?? a.fechaInicio ?? '');
            const db = b.actual ? '9999' : (b.fechaFin ?? b.fechaInicio ?? '');
            return db.localeCompare(da);
          });
          const sortedEdu = [...educacion].sort((a, b) => {
            const da = a.actual ? '9999' : (a.fechaFin ?? a.fechaInicio ?? '');
            const db = b.actual ? '9999' : (b.fechaFin ?? b.fechaInicio ?? '');
            return db.localeCompare(da);
          });
          const sortedCerts = [...certs].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));

          const fmtMd = (inicio?: string, fin?: string, actual?: boolean) => {
            const s = inicio ? formatDate(inicio) : '';
            const e = actual ? 'Presente' : (fin ? formatDate(fin) : '');
            if (s && e) return `${s} – ${e}`;
            return s || e || '';
          };

          const lines: string[] = [];
          lines.push(`# ${nombre}`);
          if (rol || ubicacion) lines.push(`**${rol}**${ubicacion ? ` · ${ubicacion}` : ''}`);
          lines.push('');
          if (p?.sobreMi) { lines.push(p.sobreMi); lines.push(''); }

          // Contacto
          const contactLines: string[] = [];
          if (p?.emailContacto) contactLines.push(`- **Email:** ${p.emailContacto}`);
          if (p?.linkedin) contactLines.push(`- **LinkedIn:** ${p.linkedin}`);
          if (p?.github) contactLines.push(`- **GitHub:** ${p.github}`);
          if (contactLines.length) {
            lines.push('## Contacto');
            lines.push(...contactLines);
            lines.push('');
          }

          // Experiencia
          if (sortedExp.length) {
            lines.push('## Experiencia laboral');
            for (const e of sortedExp) {
              lines.push(`### ${e.empresa} — ${e.rol}`);
              const dates = fmtMd(e.fechaInicio, e.fechaFin, e.actual);
              const modalStr = e.modalidad ? ` · ${e.modalidad}` : '';
              if (dates || modalStr) lines.push(`**${dates}**${modalStr}`);
              if (e.descripcion) lines.push(e.descripcion);
              lines.push('');
            }
          }

          // Educación
          if (sortedEdu.length) {
            lines.push('## Educación');
            for (const ed of sortedEdu) {
              lines.push(`### ${ed.instituto}`);
              const dates = fmtMd(ed.fechaInicio, ed.fechaFin, ed.actual);
              lines.push(`**${ed.titulo}**${dates ? ` · ${dates}` : ''}`);
              if (ed.descripcion) lines.push(ed.descripcion);
              lines.push('');
            }
          }

          // Certificaciones
          if (sortedCerts.length) {
            lines.push('## Certificaciones');
            lines.push('| Título | Emisor | Fecha |');
            lines.push('|--------|--------|-------|');
            for (const c of sortedCerts) {
              lines.push(`| ${c.titulo} | ${c.emisor ?? ''} | ${c.fecha ? formatDate(c.fecha) : ''} |`);
            }
            lines.push('');
          }

          // Habilidades técnicas
          if (p?.stack?.length) {
            lines.push('## Habilidades técnicas');
            lines.push(p.stack.join(', '));
            lines.push('');
          }

          // Habilidades blandas
          if (p?.habilidadesBlandas?.length) {
            lines.push('## Habilidades blandas');
            lines.push(p.habilidadesBlandas.join(', '));
            lines.push('');
          }

          // Idiomas
          if (p?.idiomas?.length) {
            lines.push('## Idiomas');
            lines.push('| Idioma | Nivel |');
            lines.push('|--------|-------|');
            for (const i of p.idiomas) {
              lines.push(`| ${i.nombre} | ${i.nivel} |`);
            }
            lines.push('');
          }

          // Salario (confidencial)
          const hasSalary = p?.salarioBruto || p?.salarioNeto;
          if (hasSalary) {
            lines.push('## Información salarial (confidencial)');
            if (p?.salarioBruto) lines.push(`- Salario actual bruto: ${p.salarioBruto} ${p.moneda ?? ''}`);
            if (p?.salarioNeto) lines.push(`- Salario actual neto: ${p.salarioNeto} ${p.moneda ?? ''}`);
            if (p?.metodoPago) lines.push(`- Método de pago: ${p.metodoPago}`);
            lines.push('');
          }

          return lines.join('\n');
        };

        const handleGeneratePdf = () => {
          const html = buildCvHtml();
          const win = window.open('', '_blank');
          if (!win) return;
          win.document.write(html);
          win.document.close();
        };

        const handleCopyMarkdown = () => {
          const md = buildMarkdown();
          navigator.clipboard.writeText(md).then(() => showToast('Copiado al portapapeles', 'success'));
        };

        const handleDownloadMarkdown = () => {
          const md = buildMarkdown();
          const blob = new Blob([md], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'perfil.md';
          a.click();
          URL.revokeObjectURL(url);
        };

        return (
          <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Exportar perfil</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generá tu CV en distintos formatos a partir de los datos de tu perfil.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              {/* PDF card */}
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'oklch(0.22 0.08 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="file" size={20} stroke="oklch(0.70 0.18 250)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>CV en PDF</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Formato Harvard, listo para imprimir</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                  Genera un CV profesional en blanco y negro con tipografía serif, apto para envío a empleadores.
                </div>
                <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={handleGeneratePdf}>
                  <Icon name="file" size={14} /> Generar PDF
                </button>
              </div>

              {/* Markdown card */}
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'oklch(0.22 0.08 155)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="code" size={20} stroke="oklch(0.70 0.19 155)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Markdown para IA</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Optimizado para asistentes de IA</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                  Exporta tu perfil estructurado en Markdown para usar con Claude, ChatGPT u otros asistentes.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCopyMarkdown}>
                    <Icon name="note" size={14} /> Copiar
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleDownloadMarkdown}>
                    <Icon name="download" size={14} /> .md
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      <ExperienciaModal
        open={expModalOpen}
        onClose={() => { setExpModalOpen(false); setEditExpId(null); }}
        initial={editExp}
        expId={editExpId ?? undefined}
        onAdd={async (data) => { await addExperiencia(data); showToast('Experiencia agregada', 'success'); }}
        onUpdate={async (id, data) => { await storeUpdateExperiencia(id, data); showToast('Experiencia actualizada', 'success'); }}
      />
      <EducacionModal
        open={eduModalOpen}
        onClose={() => { setEduModalOpen(false); setEditEduId(null); }}
        initial={editEdu}
        eduId={editEduId ?? undefined}
        onAdd={async (data) => { await addEducacion(data); showToast('Educación agregada', 'success'); }}
        onUpdate={async (id, data) => { await storeUpdateEducacion(id, data); showToast('Educación actualizada', 'success'); }}
      />
    </div>
  );
}

/* ---- CVs ---- */
interface CVUploadForm {
  nombre: string;
  version: string;
  descripcion: string;
  color: string;
}

const EMPTY_CV_FORM: CVUploadForm = {
  nombre: '',
  version: '',
  descripcion: '',
  color: '#3B82F6',
};

export function CVs() {
  const { cvs, addCV, removeCV, currentUser, showToast } = useApp();
  const isMobile = useIsMobile();
  const cvList = Object.values(cvs);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [form, setForm] = useState<CVUploadForm>(EMPTY_CV_FORM);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Record<string, boolean>>({});

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm({ ...EMPTY_CV_FORM, nombre: file.name.replace(/\.[^.]+$/, '') });
    setPendingFile(file);
    setFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;
    if (!currentUser) { showToast('Debes iniciar sesión', 'warn'); return; }
    if (!form.nombre.trim()) { setFormError('El nombre es requerido'); return; }
    setUploading(true);
    setFormError('');
    try {
      const cv = await dbUploadCV(pendingFile, currentUser.id, {
        nombre: form.nombre.trim(),
        version: form.version.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        color: form.color,
      });
      addCV(cv);
      showToast('CV subido correctamente', 'success');
      setPendingFile(null);
      setForm(EMPTY_CV_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al subir el CV');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const handleDeleteConfirm = async (id: string, storagePath: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    try {
      await dbDeleteCV(id, storagePath);
      removeCV(id);
      showToast('CV eliminado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar el CV', 'warn');
    }
  };

  const handleView = async (storagePath: string) => {
    try {
      const url = await getCVUrl(storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al obtener el CV', 'warn');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Mis CVs <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({cvList.length})</span></h1>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <span className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Icon name="plus" size={14} /> Subir CV
          </span>
        </label>
      </div>

      {/* Upload form (shown after file selection) */}
      {pendingFile && (
        <div className="card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Subir CV
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Archivo: <strong>{pendingFile.name}</strong> ({Math.round(pendingFile.size / 1024)} KB)
          </div>

          {formError && (
            <div style={{ background: 'var(--color-danger-soft)', border: '1px solid oklch(0.58 0.22 25 / 0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'oklch(0.50 0.22 25)', marginBottom: 12 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                className="form-input"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="ej. CV Frontend Developer"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Versión</label>
              <input
                className="form-input"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="ej. v2.0"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Descripción</label>
              <textarea
                className="form-input"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="ej. CV orientado a posiciones de frontend React"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: c,
                      border: form.color === c ? '3px solid var(--text)' : '2px solid transparent',
                      outline: form.color === c ? '2px solid var(--surface)' : 'none',
                      cursor: 'pointer', padding: 0, flexShrink: 0, boxSizing: 'border-box',
                    }}
                  />
                ))}
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: form.color, border: '1px solid var(--border)', flexShrink: 0 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => { setPendingFile(null); setForm(EMPTY_CV_FORM); setFormError(''); }} disabled={uploading}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleUploadConfirm} disabled={uploading}>
              {uploading ? 'Subiendo…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {cvList.length === 0 && !pendingFile && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Icon name="file" size={32} stroke="var(--text-subtle)" />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 12 }}>
            No tenés CVs subidos
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Subí tu primer CV para vincularlo a tus postulaciones.
          </div>
        </div>
      )}

      {/* CV list */}
      <div className="grid-3">
        {cvList.map((cv) => {
          const confirming = confirmDelete[cv.id] ?? false;
          const initials = cv.nombre.slice(0, 2).toUpperCase();
          return (
            <div key={cv.id} className="card" style={{ padding: 16, position: 'relative' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: cv.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cv.nombre}
                  </div>
                  {cv.version && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: cv.color + '22', color: cv.color, display: 'inline-block', marginTop: 2,
                    }}>{cv.version}</span>
                  )}
                </div>
              </div>

              {cv.descripcion && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                  {cv.descripcion}
                </div>
              )}

              <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 12 }}>
                {cv.sizeKb > 0 ? `${cv.sizeKb} KB` : cv.tamano} · {formatDate(cv.fecha)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                  onClick={() => handleView(cv.storagePath)}
                >
                  <Icon name="link" size={13} stroke="oklch(0.52 0.20 250)" /> Ver
                </button>
                {confirming ? (
                  <>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: 11.5, height: 'auto' }}
                      onClick={() => handleDeleteConfirm(cv.id, cv.storagePath)}
                    >
                      ¿Confirmar?
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 6px', height: 'auto' }}
                      onClick={() => setConfirmDelete((prev) => ({ ...prev, [cv.id]: false }))}
                    >
                      <Icon name="x" size={11} />
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', color: 'var(--text-subtle)' }}
                    title="Eliminar CV"
                    onClick={() => handleDeleteClick(cv.id)}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- NUEVO CONTACTO MODAL ---- */
interface NuevoContactoForm {
  nombre: string;
  rol: string;
  empresa: string;
  email: string;
  linkedin: string;
  telefono: string;
  notas: string;
  color: string;
}

const EMPTY_CONTACTO_FORM: NuevoContactoForm = {
  nombre: '',
  rol: '',
  empresa: '',
  email: '',
  linkedin: '',
  telefono: '',
  notas: '',
  color: '#3B82F6',
};

function NuevoContactoModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  initialData,
  contactoId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (contacto: Contacto) => void;
  onUpdated?: (id: string, data: Partial<Contacto>) => void;
  initialData?: Contacto;
  contactoId?: string;
}) {
  const isEdit = !!contactoId;
  const { empresas } = useApp();
  const empresaList = Object.values(empresas);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<NuevoContactoForm>(EMPTY_CONTACTO_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setForm({
        nombre: initialData.nombre,
        rol: initialData.rol ?? '',
        empresa: initialData.empresa ?? '',
        email: initialData.email ?? '',
        linkedin: initialData.linkedin ?? '',
        telefono: initialData.telefono ?? '',
        notas: initialData.notas ?? '',
        color: initialData.color ?? '#3B82F6',
      });
      setError('');
    } else if (open && !initialData) {
      setForm(EMPTY_CONTACTO_FORM);
      setError('');
    }
  }, [open, initialData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const set = (key: keyof NuevoContactoForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && contactoId) {
        const patch: Partial<Contacto> & { empresaId?: string } = {
          nombre: form.nombre.trim(),
          rol: form.rol.trim(),
          empresaId: form.empresa || undefined,
          email: form.email.trim(),
          linkedin: form.linkedin.trim(),
          telefono: form.telefono.trim(),
          notas: form.notas.trim(),
          color: form.color,
        };
        onUpdated?.(contactoId, patch);
        onClose();
      } else {
        const contacto = await dbAddContacto({
          nombre: form.nombre.trim(),
          rol: form.rol.trim(),
          empresaId: form.empresa || undefined,
          email: form.email.trim(),
          linkedin: form.linkedin.trim(),
          telefono: form.telefono.trim(),
          notas: form.notas.trim(),
          color: form.color,
        });
        onCreated?.(contacto);
        setForm(EMPTY_CONTACTO_FORM);
        setError('');
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Error al guardar los cambios' : 'Error al crear el contacto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Editar contacto' : 'Nuevo contacto'}</div>
          <div className="modal-subtitle">{isEdit ? 'Modificá los datos del contacto' : 'Agregá un contacto a tu red'}</div>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--color-danger-soft)', border: '1px solid oklch(0.58 0.22 25 / 0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'oklch(0.50 0.22 25)' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              className="form-input"
              placeholder="ej. Juan Pérez"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Rol / Cargo</label>
              <input
                className="form-input"
                placeholder="ej. Recruiter"
                value={form.rol}
                onChange={(e) => set('rol', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <select
                className="form-input"
                value={form.empresa}
                onChange={(e) => set('empresa', e.target.value)}
              >
                <option value="">Sin empresa</option>
                {empresaList.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="ej. juan@empresa.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                className="form-input"
                type="tel"
                placeholder="ej. +54 9 11 1234-5678"
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">LinkedIn</label>
            <input
              className="form-input"
              type="url"
              placeholder="ej. https://linkedin.com/in/juan"
              value={form.linkedin}
              onChange={(e) => set('linkedin', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color del avatar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid var(--text)' : '2px solid transparent',
                    outline: form.color === c ? '2px solid var(--surface)' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                />
              ))}
              <input
                type="color"
                title="Color personalizado"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
              />
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: form.color, border: '1px solid var(--border)', flexShrink: 0 }} title="Color seleccionado" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea
              className="form-input"
              placeholder="Información adicional sobre el contacto…"
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {isEdit ? (
              <>{saving ? 'Guardando…' : 'Guardar cambios'}</>
            ) : (
              <><Icon name="plus" size={14} /> {saving ? 'Creando…' : 'Agregar contacto'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- CONTACTOS ---- */
export function Contactos() {
  const { contactos, empresas, addContacto, updateContacto, deleteContacto, showToast } = useApp();
  const contactoList = Object.values(contactos);
  const [nuevoContactoOpen, setNuevoContactoOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Record<string, boolean>>({});
  const [editContactoId, setEditContactoId] = useState<string | null>(null);
  const editContacto = editContactoId ? contactos[editContactoId] : undefined;

  const handleCreated = (contacto: Contacto) => {
    addContacto(contacto);
    showToast('Contacto creado correctamente', 'success');
  };

  const handleUpdated = (id: string, data: Partial<Contacto>) => {
    updateContacto(id, data);
    showToast('Contacto actualizado', 'success');
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const handleDeleteConfirm = (id: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    deleteContacto(id);
    showToast('Contacto eliminado', 'success');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Contactos <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({contactoList.length})</span></h1>
        <button className="btn btn-primary" onClick={() => setNuevoContactoOpen(true)}>
          <Icon name="plus" size={14} /> Agregar
        </button>
      </div>

      <div className="grid-3">
        {contactoList.map((c) => {
          const confirming = confirmDelete[c.id] ?? false;
          return (
            <div key={c.id} className="contact-card" style={{ position: 'relative' }}>
              {/* Action buttons */}
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                {confirming ? (
                  <>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(c.id); }}
                    >
                      ¿Confirmar?
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '3px 6px', fontSize: 11.5, height: 'auto' }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete((prev) => ({ ...prev, [c.id]: false })); }}
                    >
                      <Icon name="x" size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }}
                      title="Editar contacto"
                      onClick={(e) => { e.stopPropagation(); setEditContactoId(c.id); }}
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }}
                      title="Eliminar contacto"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(c.id); }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="contact-avatar" style={{ background: c.color }}>{c.avatar}</div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 64 }}>
                  <div className="contact-name">{c.nombre}</div>
                  <div className="contact-role">{c.rol}</div>
                </div>
              </div>

              {c.empresa && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: empresas[c.empresa]?.color ?? 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 8, fontWeight: 700 }}>
                    {empresas[c.empresa]?.logo?.slice(0, 1)}
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{empresas[c.empresa]?.nombre ?? c.empresa}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {c.email && (
                  <a href={`mailto:${c.email}`} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 10px' }}>
                    <Icon name="mail" size={13} /> Email
                  </a>
                )}
                {c.linkedin && (
                  <a href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 10px', textDecoration: 'none' }}>
                    <Icon name="link" size={13} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NuevoContactoModal
        open={nuevoContactoOpen}
        onClose={() => setNuevoContactoOpen(false)}
        onCreated={handleCreated}
      />

      <NuevoContactoModal
        open={!!editContactoId}
        onClose={() => setEditContactoId(null)}
        onUpdated={handleUpdated}
        initialData={editContacto}
        contactoId={editContactoId ?? undefined}
      />
    </div>
  );
}

/* ---- STAR RATING ---- */
function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Determine displayed value: use hovered preview while hovering, else actual value
  const display = hovered !== null ? hovered : value;

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (readOnly || !onChange) return;
    const newVal = isHalf ? starIndex - 0.5 : starIndex;
    onChange(newVal);
  };

  const handleMouseMove = (e: MouseEvent<HTMLSpanElement>, starIndex: number) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    setHovered(isHalf ? starIndex - 0.5 : starIndex);
  };

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, userSelect: 'none' }}
      onMouseLeave={() => !readOnly && setHovered(null)}
    >
      {stars.map((starIndex) => {
        const filled = display >= starIndex;
        const half = !filled && display >= starIndex - 0.5;
        const starColor = filled || half ? 'oklch(0.78 0.16 80)' : 'var(--border)';
        return (
          <span
            key={starIndex}
            title={readOnly ? undefined : `${starIndex - 0.5} / ${starIndex}`}
            style={{
              fontSize: 18,
              lineHeight: 1,
              cursor: readOnly ? 'default' : 'pointer',
              position: 'relative',
              display: 'inline-block',
              color: starColor,
            }}
            onMouseMove={readOnly ? undefined : (e) => handleMouseMove(e, starIndex)}
            onClick={readOnly ? undefined : (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalf = e.clientX - rect.left < rect.width / 2;
              handleClick(starIndex, isHalf);
            }}
          >
            {/* Base star (empty or full) */}
            <span style={{ color: filled ? 'oklch(0.78 0.16 80)' : 'var(--border)' }}>★</span>
            {/* Half overlay */}
            {half && (
              <span style={{
                position: 'absolute', left: 0, top: 0,
                width: '50%', overflow: 'hidden',
                color: 'oklch(0.78 0.16 80)',
              }}>★</span>
            )}
          </span>
        );
      })}
      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
        {value > 0 ? `${value} / 5` : 'Sin calificación'}
      </span>
    </span>
  );
}

/* ---- NUEVA EMPRESA MODAL ---- */
interface NuevaEmpresaForm {
  nombre: string;
  industria: string;
  pais: string;
  web: string;
  notas: string;
  glassdoor: number;
  color: string;
}

const EMPTY_EMPRESA_FORM: NuevaEmpresaForm = {
  nombre: '',
  industria: '',
  pais: '',
  web: '',
  notas: '',
  glassdoor: 0,
  color: '#3B82F6',
};

function NuevaEmpresaModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  initialData,
  empresaId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (empresa: Empresa) => void;
  onUpdated?: (id: string, data: Partial<Empresa>) => void;
  initialData?: Empresa;
  empresaId?: string;
}) {
  const isEdit = !!empresaId;
  const backdropRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<NuevaEmpresaForm>(EMPTY_EMPRESA_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync form when initialData changes (modal open for edit)
  useEffect(() => {
    if (open && initialData) {
      setForm({
        nombre: initialData.nombre,
        industria: initialData.rubro,
        pais: initialData.pais,
        web: '',
        notas: '',
        glassdoor: initialData.glassdoor ?? 0,
        color: initialData.color ?? '#3B82F6',
      });
      setError('');
    } else if (open && !initialData) {
      setForm(EMPTY_EMPRESA_FORM);
      setError('');
    }
  }, [open, initialData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const set = (key: keyof NuevaEmpresaForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && empresaId) {
        const patch: Partial<Empresa> = {
          nombre: form.nombre.trim(),
          rubro: form.industria.trim(),
          pais: form.pais.trim(),
          color: form.color,
          glassdoor: form.glassdoor > 0 ? form.glassdoor : null,
        };
        onUpdated?.(empresaId, patch);
        onClose();
      } else {
        const empresa = await dbAddEmpresa({
          nombre: form.nombre.trim(),
          industria: form.industria.trim(),
          pais: form.pais.trim(),
          web: form.web.trim(),
          notas: form.notas.trim(),
          glassdoor: form.glassdoor > 0 ? form.glassdoor : null,
          rubro: form.industria.trim(),
          color: form.color,
        });
        onCreated?.(empresa);
        setForm(EMPTY_EMPRESA_FORM);
        setError('');
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Error al guardar los cambios' : 'Error al crear la empresa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Editar empresa' : 'Nueva empresa'}</div>
          <div className="modal-subtitle">{isEdit ? 'Modificá los datos de la empresa' : 'Agregá una empresa para hacer seguimiento'}</div>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--color-danger-soft)', border: '1px solid oklch(0.58 0.22 25 / 0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'oklch(0.50 0.22 25)' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              className="form-input"
              placeholder="ej. Mercado Libre"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Industria</label>
              <input
                className="form-input"
                placeholder="ej. Tecnología"
                value={form.industria}
                onChange={(e) => set('industria', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">País</label>
              <input
                className="form-input"
                placeholder="ej. Argentina"
                value={form.pais}
                onChange={(e) => set('pais', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Web</label>
            <input
              className="form-input"
              type="url"
              placeholder="ej. https://empresa.com"
              value={form.web}
              onChange={(e) => set('web', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid var(--text)' : '2px solid transparent',
                    outline: form.color === c ? '2px solid var(--surface)' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                />
              ))}
              <input
                type="color"
                title="Color personalizado"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
              />
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: form.color, border: '1px solid var(--border)', flexShrink: 0 }} title="Color seleccionado" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Glassdoor</label>
            <StarRating
              value={form.glassdoor}
              onChange={(v) => setForm((prev) => ({ ...prev, glassdoor: v }))}
            />
          </div>

          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea
                className="form-input"
                placeholder="Información adicional sobre la empresa…"
                value={form.notas}
                onChange={(e) => set('notas', e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {isEdit ? (
              <>{saving ? 'Guardando…' : 'Guardar cambios'}</>
            ) : (
              <><Icon name="plus" size={14} /> {saving ? 'Creando…' : 'Crear empresa'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- EMPRESAS ---- */
export function Empresas() {
  const { ofertas, setPage, empresas, addEmpresa, updateEmpresa, deleteEmpresa, showToast } = useApp();
  const empresaList = Object.values(empresas);
  const [nuevaEmpresaOpen, setNuevaEmpresaOpen] = useState(false);
  // Map of empresa id -> confirm state
  const [confirmDelete, setConfirmDelete] = useState<Record<string, boolean>>({});
  // Edit modal state
  const [editEmpresaId, setEditEmpresaId] = useState<string | null>(null);
  const editEmpresa = editEmpresaId ? empresas[editEmpresaId] : undefined;

  const handleCreated = (empresa: Empresa) => {
    addEmpresa(empresa);
    showToast('Empresa creada correctamente', 'success');
  };

  const handleUpdated = (id: string, data: Partial<Empresa>) => {
    updateEmpresa(id, data);
    showToast('Empresa actualizada', 'success');
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: true }));
    // Auto-reset after 3 seconds if not confirmed
    setTimeout(() => {
      setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const handleDeleteConfirm = (id: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    deleteEmpresa(id);
    showToast('Empresa eliminada', 'success');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Empresas <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({empresaList.length})</span></h1>
        <button className="btn btn-primary" onClick={() => setNuevaEmpresaOpen(true)}>
          <Icon name="plus" size={14} /> Nueva empresa
        </button>
      </div>

      <div className="grid-3">
        {empresaList.map((emp) => {
          const empOfertas = ofertas.filter((o) => o.empresa === emp.id);
          const confirming = confirmDelete[emp.id] ?? false;
          return (
            <div key={emp.id} className="company-card" style={{ position: 'relative' }}>
              {/* Action buttons */}
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                {confirming ? (
                  <>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(emp.id); }}
                    >
                      ¿Confirmar?
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '3px 6px', fontSize: 11.5, height: 'auto' }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete((prev) => ({ ...prev, [emp.id]: false })); }}
                    >
                      <Icon name="x" size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }}
                      title="Editar empresa"
                      onClick={(e) => { e.stopPropagation(); setEditEmpresaId(emp.id); }}
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }}
                      title="Eliminar empresa"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(emp.id); }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {emp.logo}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 64 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nombre}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{emp.rubro}</div>
                </div>
                {empOfertas.length > 0 && (
                  <span className="badge badge-aplicada" style={{ flexShrink: 0, marginRight: 60 }}>{empOfertas.length}</span>
                )}
              </div>

              <dl className="info-grid">
                <dt>Tamaño</dt><dd style={{ textTransform: 'capitalize' }}>{emp.tamaño}</dd>
                <dt>País</dt><dd>{emp.pais}</dd>
              </dl>

              {emp.glassdoor != null && emp.glassdoor > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Glassdoor</div>
                  <StarRating value={emp.glassdoor} readOnly />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NuevaEmpresaModal
        open={nuevaEmpresaOpen}
        onClose={() => setNuevaEmpresaOpen(false)}
        onCreated={handleCreated}
      />

      <NuevaEmpresaModal
        open={!!editEmpresaId}
        onClose={() => setEditEmpresaId(null)}
        onUpdated={handleUpdated}
        initialData={editEmpresa}
        empresaId={editEmpresaId ?? undefined}
      />
    </div>
  );
}

/* ---- NUEVA PLATAFORMA MODAL ---- */
interface NuevaPlataformaForm {
  nombre: string;
  url: string;
  color: string;
  descripcion: string;
}

const EMPTY_PLATAFORMA_FORM: NuevaPlataformaForm = {
  nombre: '',
  url: '',
  color: '#3B82F6',
  descripcion: '',
};

function NuevaPlataformaModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  initialData,
  plataformaId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (plataforma: Plataforma) => void;
  onUpdated?: (id: string, data: Partial<Plataforma>) => void;
  initialData?: Plataforma;
  plataformaId?: string;
}) {
  const isEdit = !!plataformaId;
  const backdropRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<NuevaPlataformaForm>(EMPTY_PLATAFORMA_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { currentUser } = useApp();

  useEffect(() => {
    if (open && initialData) {
      setForm({
        nombre: initialData.nombre,
        url: initialData.url ?? '',
        color: initialData.color ?? '#3B82F6',
        descripcion: initialData.descripcion ?? '',
      });
      setError('');
    } else if (open && !initialData) {
      setForm(EMPTY_PLATAFORMA_FORM);
      setError('');
    }
  }, [open, initialData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const set = (key: keyof NuevaPlataformaForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const logo = form.nombre.slice(0, 2).toUpperCase() || 'PL';

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && plataformaId) {
        const patch: Partial<Plataforma> = {
          nombre: form.nombre.trim(),
          url: form.url.trim() || undefined,
          color: form.color,
          descripcion: form.descripcion.trim() || undefined,
        };
        onUpdated?.(plataformaId, patch);
        onClose();
      } else {
        const plataforma = await dbAddPlataforma({
          nombre: form.nombre.trim(),
          url: form.url.trim() || undefined,
          color: form.color,
          descripcion: form.descripcion.trim() || undefined,
        }, currentUser?.id);
        onCreated?.(plataforma);
        setForm(EMPTY_PLATAFORMA_FORM);
        setError('');
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Error al guardar los cambios' : 'Error al crear la plataforma');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Editar plataforma' : 'Nueva plataforma'}</div>
          <div className="modal-subtitle">{isEdit ? 'Modificá los datos de la plataforma' : 'Agregá una plataforma de búsqueda de trabajo'}</div>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--color-danger-soft)', border: '1px solid oklch(0.58 0.22 25 / 0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'oklch(0.50 0.22 25)' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {logo}
              </div>
              <input
                className="form-input"
                placeholder="ej. LinkedIn"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">URL</label>
            <input
              className="form-input"
              type="url"
              placeholder="ej. https://linkedin.com/jobs"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid var(--text)' : '2px solid transparent',
                    outline: form.color === c ? '2px solid var(--surface)' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                />
              ))}
              <input
                type="color"
                title="Color personalizado"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
              />
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: form.color, border: '1px solid var(--border)', flexShrink: 0 }} title="Color seleccionado" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              placeholder="Información adicional sobre la plataforma…"
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {isEdit ? (
              <>{saving ? 'Guardando…' : 'Guardar cambios'}</>
            ) : (
              <><Icon name="plus" size={14} /> {saving ? 'Creando…' : 'Crear plataforma'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- PLATAFORMAS ---- */
export function Plataformas() {
  const { plataformas, addPlataforma, updatePlataforma, deletePlataforma, showToast } = useApp();
  const plataformaList = Object.values(plataformas);
  const [nuevaPlataformaOpen, setNuevaPlataformaOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Record<string, boolean>>({});
  const [editPlataformaId, setEditPlataformaId] = useState<string | null>(null);
  const editPlataforma = editPlataformaId ? plataformas[editPlataformaId] : undefined;

  const handleCreated = (plataforma: Plataforma) => {
    addPlataforma(plataforma);
    showToast('Plataforma creada correctamente', 'success');
  };

  const handleUpdated = (id: string, data: Partial<Plataforma>) => {
    updatePlataforma(id, data);
    showToast('Plataforma actualizada', 'success');
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const handleDeleteConfirm = (id: string) => {
    setConfirmDelete((prev) => ({ ...prev, [id]: false }));
    deletePlataforma(id);
    showToast('Plataforma eliminada', 'success');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          Plataformas{' '}
          {plataformaList.length > 0 && (
            <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({plataformaList.length})</span>
          )}
        </h1>
        <button className="btn btn-primary" onClick={() => setNuevaPlataformaOpen(true)}>
          <Icon name="plus" size={14} /> Nueva plataforma
        </button>
      </div>

      <div className="grid-3">
        {plataformaList.map((p) => {
          const confirming = confirmDelete[p.id] ?? false;
          const logo = p.logo ?? p.nombre.slice(0, 2).toUpperCase();
          return (
            <div key={p.id} className="company-card" style={{ position: 'relative' }}>
              {/* Action buttons */}
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                {confirming ? (
                  <>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(p.id); }}
                    >
                      ¿Confirmar?
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '3px 6px', fontSize: 11.5, height: 'auto' }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete((prev) => ({ ...prev, [p.id]: false })); }}
                    >
                      <Icon name="x" size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }}
                      title="Editar plataforma"
                      onClick={(e) => { e.stopPropagation(); setEditPlataformaId(p.id); }}
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-subtle)' }}
                      title="Eliminar plataforma"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(p.id); }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {logo}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 64 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                  {p.descripcion && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                  )}
                </div>
              </div>

              {p.url && (
                <a
                  href={p.url.startsWith('http') ? p.url : `https://${p.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '6px 10px', textDecoration: 'none' }}
                >
                  <Icon name="link" size={13} /> {p.url.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <NuevaPlataformaModal
        open={nuevaPlataformaOpen}
        onClose={() => setNuevaPlataformaOpen(false)}
        onCreated={handleCreated}
      />

      <NuevaPlataformaModal
        open={!!editPlataformaId}
        onClose={() => setEditPlataformaId(null)}
        onUpdated={handleUpdated}
        initialData={editPlataforma}
        plataformaId={editPlataformaId ?? undefined}
      />
    </div>
  );
}

/* ---- CONFIGURACION ---- */
export function Configuracion() {
  const { perfil, currentUser } = useApp();
  const nombre = perfil?.nombre
    ? `${perfil.nombre}${perfil.apellido ? ' ' + perfil.apellido : ''}`
    : currentUser?.email ?? '';
  const email = currentUser?.email ?? '';

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Configuración</h1>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Cuenta</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { l: 'Nombre', v: nombre },
              { l: 'Email', v: email },
              { l: 'País', v: perfil?.pais ?? 'Argentina' },
            ].map(({ l, v }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Preferencias</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { l: 'Moneda preferida', v: 'USD' },
              { l: 'Idioma', v: 'Español' },
              { l: 'Notificaciones', v: 'Activadas' },
            ].map(({ l, v }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ border: '1px solid var(--color-danger-soft)' }}>
          <div className="card-header"><span className="card-title" style={{ color: 'oklch(0.50 0.22 25)' }}>Zona de peligro</span></div>
          <div className="card-body">
            <button className="btn btn-danger">Eliminar cuenta</button>
          </div>
        </div>
      </div>
    </div>
  );
}

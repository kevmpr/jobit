import React, { useState } from 'react';
import { Icon } from './icons';
import { useApp } from './store';

/* ---- PERFIL ---- */
export function Perfil() {
  const { perfil } = useApp();
  const perfilUsuario = perfil ?? {
    nombre: '', apellido: '', email: '', telefono: '', linkedin: '',
    rol: '', empresa: '', senioridad: '', aniosExp: 0,
    pais: '', ciudad: '', salarioBruto: 0, salarioNeto: 0,
    moneda: 'USD' as const, modalidad: 'remoto' as const,
    pretensionBruta: 0, pretensionNeta: 0, stack: [], certificaciones: [],
  };
  const [stack, setStack] = useState(perfilUsuario.stack);

  const removeStack = (s: string) => setStack(stack.filter((x) => x !== s));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Mi perfil</h1>
        <button className="btn btn-primary"><Icon name="edit" size={14} /> Editar</button>
      </div>

      <div className="perfil-layout">
        {/* Left card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div className="perfil-avatar">KA</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {perfilUsuario.nombre} {perfilUsuario.apellido}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
              {perfilUsuario.rol} · {perfilUsuario.empresa}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-aplicada">{perfilUsuario.senioridad}</span>
              <span className="badge badge-en_proceso">{perfilUsuario.aniosExp} años exp.</span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={`mailto:${perfilUsuario.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', textDecoration: 'none' }}>
                <Icon name="mail" size={14} /> {perfilUsuario.email}
              </a>
              <a style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', textDecoration: 'none' }}>
                <Icon name="phone" size={14} /> {perfilUsuario.telefono}
              </a>
              <a href={`https://${perfilUsuario.linkedin}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'oklch(0.52 0.20 250)', textDecoration: 'none' }}>
                <Icon name="link" size={14} stroke="oklch(0.52 0.20 250)" /> {perfilUsuario.linkedin}
              </a>
            </div>
          </div>

          {/* Situación laboral */}
          <div className="card">
            <div className="card-header"><span className="card-title">Situación laboral</span></div>
            <div className="card-body">
              <div className="grid-2">
                {[
                  { l: 'Rol actual', v: perfilUsuario.rol },
                  { l: 'Empresa', v: perfilUsuario.empresa },
                  { l: 'Senioridad', v: perfilUsuario.senioridad },
                  { l: 'Modalidad', v: perfilUsuario.modalidad },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500, textTransform: 'capitalize' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Compensación actual */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Compensación actual</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="eye" size={12} /> Privado
              </span>
            </div>
            <div className="card-body">
              <div className="grid-4">
                {[
                  { l: 'Bruto/mes', v: `${perfilUsuario.moneda} ${perfilUsuario.salarioBruto.toLocaleString()}` },
                  { l: 'Neto/mes', v: `${perfilUsuario.moneda} ${perfilUsuario.salarioNeto.toLocaleString()}` },
                  { l: 'Moneda', v: perfilUsuario.moneda },
                  { l: 'Modo pago', v: 'Mensual' },
                ].map(({ l, v }) => (
                  <div key={l} className="comp-cell">
                    <div className="comp-cell-label">{l}</div>
                    <div className="comp-cell-value" style={{ fontSize: 16 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pretensión */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pretensión salarial</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'oklch(0.52 0.20 250)' }}>
                <Icon name="sparkles" size={13} stroke="oklch(0.52 0.20 250)" />
                +100% vs actual
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { l: 'Bruto pretendido', v: `${perfilUsuario.moneda} ${perfilUsuario.pretensionBruta.toLocaleString()}` },
                  { l: 'Neto pretendido', v: `${perfilUsuario.moneda} ${perfilUsuario.pretensionNeta.toLocaleString()}` },
                  { l: 'Negociable', v: 'Sí (±10%)' },
                ].map(({ l, v }) => (
                  <div key={l} className="comp-cell">
                    <div className="comp-cell-label">{l}</div>
                    <div className="comp-cell-value" style={{ fontSize: 16 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stack */}
          <div className="card">
            <div className="card-header"><span className="card-title">Stack tecnológico</span></div>
            <div className="card-body">
              <div className="stack-chips">
                {stack.map((s) => (
                  <span key={s} className="stack-chip">
                    {s}
                    <button className="stack-chip-del" onClick={() => removeStack(s)}>
                      <Icon name="x" size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certificaciones */}
          <div className="card">
            <div className="card-header"><span className="card-title">Certificaciones</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {perfilUsuario.certificaciones.map((cert) => (
                <div key={cert} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="award" size={16} stroke="oklch(0.70 0.19 155)" />
                  <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- CVs ---- */
export function CVs() {
  const { cvs } = useApp();
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Mis CVs</h1>
        <button className="btn btn-primary"><Icon name="plus" size={14} /> Subir CV</button>
      </div>

      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        style={{ marginBottom: 24 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        <Icon name="download" size={28} stroke="oklch(0.52 0.20 250)" />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 10 }}>
          Arrastrá tu CV aquí
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          PDF, DOCX — hasta 10 MB
        </div>
      </div>

      <div className="grid-3">
        {cvs.map((cv) => (
          <div key={cv.id} className="file-card">
            <div className="file-thumbnail" style={{ background: cv.color + '22' }}>
              <div className="file-paper" style={{ background: 'white' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="file-paper-line" style={{ background: cv.color + '44', width: `${45 + i * 8}%` }} />
                ))}
              </div>
              <span style={{
                position: 'absolute', top: 8, right: 8,
                background: cv.color, color: 'white', fontSize: 10, fontWeight: 700,
                padding: '2px 6px', borderRadius: 4
              }}>{cv.version}</span>
            </div>
            <div className="file-info">
              <div className="file-name">{cv.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0' }}>{cv.descripcion}</div>
              <div className="file-meta">{cv.tamano} · {cv.fecha} · {cv.ofertasUsadas} ofertas</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- CONTACTOS ---- */
export function Contactos() {
  const { contactos, empresas } = useApp();
  const contactoList = Object.values(contactos);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Contactos <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({contactoList.length})</span></h1>
        <button className="btn btn-primary"><Icon name="plus" size={14} /> Agregar</button>
      </div>

      <div className="grid-3">
        {contactoList.map((c) => (
          <div key={c.id} className="contact-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="contact-avatar" style={{ background: c.color }}>{c.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="contact-name">{c.nombre}</div>
                <div className="contact-role">{c.rol}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: empresas[c.empresa]?.color ?? 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 8, fontWeight: 700 }}>
                {empresas[c.empresa]?.logo?.slice(0, 1)}
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{empresas[c.empresa]?.nombre ?? c.empresa}</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`mailto:${c.email}`} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 10px' }}>
                <Icon name="mail" size={13} /> Email
              </a>
              <a href={`https://${c.linkedin}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 10px', textDecoration: 'none' }}>
                <Icon name="link" size={13} /> LinkedIn
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- EMPRESAS ---- */
export function Empresas() {
  const { ofertas, setPage, empresas } = useApp();
  const empresaList = Object.values(empresas);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Empresas <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>({empresaList.length})</span></h1>
      </div>

      <div className="grid-3">
        {empresaList.map((emp) => {
          const empOfertas = ofertas.filter((o) => o.empresa === emp.id);
          return (
            <div key={emp.id} className="company-card" onClick={() => {}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: emp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {emp.logo}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nombre}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{emp.rubro}</div>
                </div>
                {empOfertas.length > 0 && (
                  <span className="badge badge-aplicada" style={{ flexShrink: 0 }}>{empOfertas.length}</span>
                )}
              </div>

              <dl className="info-grid">
                <dt>Tamaño</dt><dd style={{ textTransform: 'capitalize' }}>{emp.tamaño}</dd>
                <dt>País</dt><dd>{emp.pais}</dd>
                {emp.glassdoor && <><dt>Glassdoor</dt><dd>⭐ {emp.glassdoor}</dd></>}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- NOTAS ---- */
export function Notas() {
  const { notas: notasData } = useApp();
  const firstNota = notasData[0];
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(firstNota?.id ?? '');
  const [editTitle, setEditTitle] = useState(firstNota?.titulo ?? '');
  const [editContent, setEditContent] = useState(firstNota?.contenido ?? '');

  const filtered = notasData.filter((n) =>
    n.titulo.toLowerCase().includes(search.toLowerCase()) ||
    n.contenido.toLowerCase().includes(search.toLowerCase())
  );

  const activeNota = notasData.find((n) => n.id === activeId);

  const handleSelect = (id: string) => {
    const nota = notasData.find((n) => n.id === id);
    if (nota) {
      setActiveId(id);
      setEditTitle(nota.titulo);
      setEditContent(nota.contenido);
    }
  };

  return (
    <div className="page-content" style={{ padding: 0, display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Note list */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>Notas</div>
          <div className="topbar-search" style={{ maxWidth: '100%' }}>
            <span className="topbar-search-icon"><Icon name="search" size={13} /></span>
            <input
              type="text"
              placeholder="Buscar notas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px 6px 28px', fontSize: 12.5, color: 'var(--text)', outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {filtered.map((nota) => (
            <div
              key={nota.id}
              className={`note-list-item${activeId === nota.id ? ' active' : ''}`}
              onClick={() => handleSelect(nota.id)}
            >
              <div className="note-list-title">{nota.titulo}</div>
              <div className="note-list-preview">{nota.contenido.slice(0, 60).replace(/\n/g, ' ')}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                {nota.tags.map((tag) => (
                  <span key={tag} className="chip" style={{ fontSize: 10, padding: '1px 5px' }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Icon name="plus" size={14} /> Nueva nota
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeNota ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 28, overflow: 'hidden' }}>
            <input
              className="note-editor-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {activeNota.tags.map((tag) => (
                <span key={tag} className="chip" style={{ fontSize: 11.5 }}>{tag}</span>
              ))}
            </div>
            <textarea
              className="note-editor-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ flex: 1, resize: 'none' }}
            />
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-subtle)' }}>
              Actualizado: {activeNota.actualizadoEn}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
            Seleccioná una nota
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- CONFIGURACION ---- */
export function Configuracion() {
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
              { l: 'Nombre', v: 'Kevin Aguilar' },
              { l: 'Email', v: 'kevin.aguilar@email.com' },
              { l: 'País', v: 'Argentina' },
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

import { useState, type KeyboardEvent } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import { useIsMobile } from './hooks';
import type { Caso, CasoMetrica, CasoProyectoCerrado, CasoProyectoActivo, CasoIniciativa } from './types';

/* ---- helpers ---- */
function newId() { return crypto.randomUUID(); }

function fmt(n?: number, moneda?: string) {
  if (n == null) return '—';
  return n.toLocaleString('es-AR') + (moneda ? ` ${moneda}` : '');
}

/* ---- ChipInput (local copy for independence) ---- */
function ChipInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
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

/* ---- fieldStyle helpers ---- */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'var(--surface-muted)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none',
};
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };
// rowStyle is now computed per-component based on isMobile

/* ---- empty caso factory ---- */
function emptyCaso(): Omit<Caso, 'id' | 'createdAt'> {
  return {
    empresa: '',
    rolActual: '',
    rolSolicitado: '',
    fechaDesde: '',
    fechaHasta: '',
    resumenEjecutivo: '',
    conclusion: '',
    metricas: [],
    proyectosCerrados: [],
    proyectosActivos: [],
    iniciativas: [],
    competenciasTecnicas: [],
    competenciasBlandas: [],
    moneda: 'ARS',
  };
}

/* ==============================
   PDF BUILDERS
   ============================== */

function buildTecnicoHtml(caso: Caso, nombre: string): string {
  const scriptClose = '</' + 'script>';

  const metricasHtml = caso.metricas.length === 0 ? '' : `
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:4px">
      ${caso.metricas.map((m) => `
        <div style="border:1.5px solid #1e2d4a;border-radius:8px;padding:10px 18px;text-align:center;min-width:100px">
          <div style="font-size:22pt;font-weight:bold;color:#1e2d4a;line-height:1">${m.valor}</div>
          <div style="font-size:10pt;font-weight:bold;margin-top:2px">${m.etiqueta}</div>
          ${m.subtitulo ? `<div style="font-size:8.5pt;color:#555">${m.subtitulo}</div>` : ''}
        </div>
      `).join('')}
    </div>`;

  const sectionHdr = (t: string) =>
    `<div style="background:#1e2d4a;color:#fff;padding:7px 14px;font-size:11pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;margin:22px 0 10px;border-radius:4px">${t}</div>`;

  const proyectosCerradosHtml = caso.proyectosCerrados.length === 0 ? '' :
    sectionHdr('Proyectos Cerrados') +
    `<table style="width:100%;border-collapse:collapse;font-size:10pt">
      <thead><tr style="background:#e8ecf4">
        <th style="padding:6px 8px;text-align:left;border:1px solid #ccc">Cliente</th>
        <th style="padding:6px 8px;text-align:left;border:1px solid #ccc">Escala</th>
        <th style="padding:6px 8px;text-align:left;border:1px solid #ccc">Ejecución técnica</th>
        <th style="padding:6px 8px;text-align:left;border:1px solid #ccc">Impacto clave</th>
      </tr></thead>
      <tbody>
        ${caso.proyectosCerrados.map((p) => `
          <tr style="${p.destacado ? 'background:#fffbe6' : ''}">
            <td style="padding:6px 8px;border:1px solid #ccc">${p.destacado ? '★ ' : ''}${p.cliente}</td>
            <td style="padding:6px 8px;border:1px solid #ccc">${p.escala ?? ''}</td>
            <td style="padding:6px 8px;border:1px solid #ccc">${p.ejecucion ?? ''}</td>
            <td style="padding:6px 8px;border:1px solid #ccc">${p.impacto ?? ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  const proyectosActivosHtml = caso.proyectosActivos.length === 0 ? '' :
    sectionHdr('Proyectos en Curso') +
    caso.proyectosActivos.map((p) =>
      `<div style="margin-bottom:12px;page-break-inside:avoid">
        <div style="font-weight:bold;font-size:11pt;margin-bottom:4px">${p.nombre}</div>
        <ul style="margin:0 0 0 18px;padding:0">
          ${p.bullets.filter(Boolean).map((b) => `<li style="margin-bottom:2px;font-size:10.5pt">${b}</li>`).join('')}
        </ul>
      </div>`
    ).join('');

  const iniciativasHtml = caso.iniciativas.length === 0 ? '' :
    sectionHdr('Iniciativas') +
    caso.iniciativas.map((ini) =>
      `<div style="margin-bottom:14px;page-break-inside:avoid">
        <div style="font-weight:bold;font-size:11pt">${ini.nombre}</div>
        ${ini.descripcion ? `<div style="font-size:10pt;color:#444;margin-top:2px">${ini.descripcion}</div>` : ''}
        ${ini.bullets.filter(Boolean).length > 0 ? `<ul style="margin:4px 0 0 18px;padding:0">${ini.bullets.filter(Boolean).map((b) => `<li style="font-size:10.5pt;margin-bottom:2px">${b}</li>`).join('')}</ul>` : ''}
        ${ini.resultado ? `<div style="margin-top:6px;padding:6px 10px;background:#e8f5e9;border-left:3px solid #388e3c;font-size:10.5pt"><strong>Resultado:</strong> ${ini.resultado}</div>` : ''}
      </div>`
    ).join('');

  const competenciasHtml = (caso.competenciasTecnicas.length + caso.competenciasBlandas.length) === 0 ? '' :
    sectionHdr('Competencias') +
    `<div style="display:flex;gap:30px">
      ${caso.competenciasTecnicas.length > 0 ? `
        <div style="flex:1">
          <div style="font-weight:bold;margin-bottom:6px">Técnicas</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${caso.competenciasTecnicas.map((c) => `<span style="background:#e8ecf4;padding:3px 10px;border-radius:20px;font-size:10pt">${c}</span>`).join('')}
          </div>
        </div>` : ''}
      ${caso.competenciasBlandas.length > 0 ? `
        <div style="flex:1">
          <div style="font-weight:bold;margin-bottom:6px">Blandas</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${caso.competenciasBlandas.map((c) => `<span style="background:#f0e8f4;padding:3px 10px;border-radius:20px;font-size:10pt">${c}</span>`).join('')}
          </div>
        </div>` : ''}
    </div>`;

  const hasSalary = caso.salarioActual || caso.salarioSolicitado || caso.salarioMercadoMin || caso.salarioMercadoMax;
  const salarioHtml = (!hasSalary && !caso.conclusion) ? '' :
    sectionHdr('Justificación Salarial') +
    (hasSalary ? `<table style="width:100%;border-collapse:collapse;font-size:10.5pt;margin-bottom:10px">
      <tbody>
        ${caso.salarioActual ? `<tr><td style="padding:5px 8px;border:1px solid #ccc;font-weight:600">Salario actual</td><td style="padding:5px 8px;border:1px solid #ccc">${fmt(caso.salarioActual, caso.moneda)}</td></tr>` : ''}
        ${caso.salarioSolicitado ? `<tr><td style="padding:5px 8px;border:1px solid #ccc;font-weight:600">Salario solicitado</td><td style="padding:5px 8px;border:1px solid #ccc">${fmt(caso.salarioSolicitado, caso.moneda)}</td></tr>` : ''}
        ${(caso.salarioMercadoMin || caso.salarioMercadoMax) ? `<tr><td style="padding:5px 8px;border:1px solid #ccc;font-weight:600">Benchmark mercado</td><td style="padding:5px 8px;border:1px solid #ccc">${fmt(caso.salarioMercadoMin, caso.moneda)} – ${fmt(caso.salarioMercadoMax, caso.moneda)}${caso.fuenteMercado ? ` (${caso.fuenteMercado})` : ''}</td></tr>` : ''}
      </tbody>
    </table>` : '') +
    (caso.conclusion ? `<div style="padding:10px 14px;background:#f5f5f5;border-left:4px solid #1e2d4a;font-size:10.5pt;line-height:1.6">${caso.conclusion}</div>` : '');

  const periodo = [caso.fechaDesde, caso.fechaHasta].filter(Boolean).join(' – ');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe Técnico – ${caso.empresa}</title>
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
      body{font-family:'Times New Roman',Georgia,serif;font-size:11pt;color:#111;background:#fff;margin:0;padding:0}
      *{box-sizing:border-box}
      h2{page-break-after:avoid;break-after:avoid}
      table{page-break-inside:avoid}
    </style></head><body>
    <!-- HEADER -->
    <div style="border-bottom:3px solid #1e2d4a;padding-bottom:14px;margin-bottom:18px">
      <div style="font-size:9pt;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Informe Técnico de Desempeño</div>
      <div style="font-size:20pt;font-weight:bold;color:#1e2d4a;line-height:1.1">${nombre}</div>
      <div style="font-size:12pt;margin-top:4px;color:#333">
        ${caso.rolActual ? caso.rolActual : ''}${caso.rolActual && caso.rolSolicitado ? ' → ' : ''}${caso.rolSolicitado ? `<strong>${caso.rolSolicitado}</strong>` : ''}
      </div>
      <div style="font-size:10pt;color:#555;margin-top:3px">
        ${caso.empresa}${periodo ? ` · ${periodo}` : ''}
      </div>
    </div>

    ${metricasHtml ? `${sectionHdr('Métricas Clave')}${metricasHtml}` : ''}
    ${caso.resumenEjecutivo ? `${sectionHdr('Resumen Ejecutivo')}<p style="font-size:10.5pt;line-height:1.6;margin:0">${caso.resumenEjecutivo}</p>` : ''}
    ${proyectosCerradosHtml}
    ${proyectosActivosHtml}
    ${iniciativasHtml}
    ${competenciasHtml}
    ${salarioHtml}
  </body></html>`;
}

function buildBusinessCaseHtml(caso: Caso, nombre: string): string {
  const scriptClose = '</' + 'script>';

  const sectionHdr = (t: string) =>
    `<div style="background:#1e2d4a;color:#fff;padding:7px 14px;font-size:11pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;margin:22px 0 10px;border-radius:4px">${t}</div>`;

  const metricasHtml = caso.metricas.length === 0 ? '' : `
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
      ${caso.metricas.map((m) => `
        <div style="border:1.5px solid #1e2d4a;border-radius:8px;padding:8px 14px;text-align:center;min-width:90px">
          <div style="font-size:20pt;font-weight:bold;color:#1e2d4a;line-height:1">${m.valor}</div>
          <div style="font-size:9.5pt;font-weight:bold">${m.etiqueta}</div>
          ${m.subtitulo ? `<div style="font-size:8pt;color:#555">${m.subtitulo}</div>` : ''}
        </div>
      `).join('')}
    </div>`;

  // ROI section — projects + initiatives combined
  const roiItems = [
    ...caso.proyectosCerrados.filter((p) => p.impacto).map((p) => ({ nombre: p.cliente, valor: p.impacto ?? '' })),
    ...caso.iniciativas.filter((i) => i.resultado).map((i) => ({ nombre: i.nombre, valor: i.resultado ?? '' })),
  ];
  const roiHtml = roiItems.length === 0 ? '' :
    sectionHdr('ROI & Valor Generado') +
    `<table style="width:100%;border-collapse:collapse;font-size:10.5pt">
      <thead><tr style="background:#e8ecf4">
        <th style="padding:7px 10px;text-align:left;border:1px solid #ccc">Proyecto / Iniciativa</th>
        <th style="padding:7px 10px;text-align:left;border:1px solid #ccc">Valor / Impacto de negocio</th>
      </tr></thead>
      <tbody>
        ${roiItems.map((r) => `<tr><td style="padding:7px 10px;border:1px solid #ccc;font-weight:600">${r.nombre}</td><td style="padding:7px 10px;border:1px solid #ccc">${r.valor}</td></tr>`).join('')}
      </tbody>
    </table>`;

  // Retención vs Reemplazo
  const costoReemplazoEstimate = caso.salarioSolicitado
    ? `Estimado 1.5× – 2× el salario anual solicitado (${fmt(caso.salarioSolicitado, caso.moneda)}/mes)`
    : 'Reclutamiento, onboarding, curva de aprendizaje (3–6 meses mínimo)';
  const retencionHtml =
    sectionHdr('Costo de Retención vs. Reemplazo') +
    `<div style="display:flex;gap:16px;margin-bottom:10px">
      <div style="flex:1;border:2px solid #388e3c;border-radius:8px;padding:12px 16px">
        <div style="font-size:11pt;font-weight:bold;color:#388e3c;margin-bottom:8px">✓ Retener</div>
        <ul style="margin:0 0 0 16px;padding:0;font-size:10.5pt">
          ${caso.salarioSolicitado ? `<li>Costo mensual: <strong>${fmt(caso.salarioSolicitado, caso.moneda)}</strong></li>` : ''}
          <li>Conocimiento institucional y contexto acumulado</li>
          <li>Relaciones con clientes y equipo establecidas</li>
          <li>Productividad inmediata sin curva de aprendizaje</li>
          <li>Riesgo de fuga eliminado</li>
        </ul>
      </div>
      <div style="flex:1;border:2px solid #c62828;border-radius:8px;padding:12px 16px">
        <div style="font-size:11pt;font-weight:bold;color:#c62828;margin-bottom:8px">✗ No retener</div>
        <ul style="margin:0 0 0 16px;padding:0;font-size:10.5pt">
          <li>${costoReemplazoEstimate}</li>
          <li>3–6 meses para alcanzar productividad plena</li>
          <li>Riesgo de transferencia de conocimiento</li>
          <li>Impacto en proyectos activos y roadmap</li>
          <li>Costo indirecto de moral del equipo</li>
        </ul>
      </div>
    </div>
    <div style="padding:10px 14px;background:#fff3e0;border-left:4px solid #e65100;font-size:10.5pt;font-weight:600">
      Costo real de reemplazo &gt; costo de retención. La inversión en retención es la opción estratégicamente más eficiente.
    </div>`;

  // Evidence table (abbreviated)
  const evidenceHtml = caso.proyectosCerrados.length === 0 ? '' :
    sectionHdr('Evidencia de Desempeño') +
    `<table style="width:100%;border-collapse:collapse;font-size:10pt">
      <thead><tr style="background:#e8ecf4">
        <th style="padding:6px 8px;border:1px solid #ccc;text-align:left">Cliente</th>
        <th style="padding:6px 8px;border:1px solid #ccc;text-align:left">Escala</th>
        <th style="padding:6px 8px;border:1px solid #ccc;text-align:left">Impacto</th>
      </tr></thead>
      <tbody>
        ${caso.proyectosCerrados.map((p) => `<tr${p.destacado ? ' style="background:#fffbe6"' : ''}>
          <td style="padding:6px 8px;border:1px solid #ccc">${p.destacado ? '★ ' : ''}${p.cliente}</td>
          <td style="padding:6px 8px;border:1px solid #ccc">${p.escala ?? ''}</td>
          <td style="padding:6px 8px;border:1px solid #ccc">${p.impacto ?? ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  // Benchmark
  const benchmarkHtml = (caso.salarioMercadoMin || caso.salarioMercadoMax) ?
    sectionHdr('Benchmark Salarial') +
    `<table style="width:100%;border-collapse:collapse;font-size:10.5pt">
      <tbody>
        ${caso.salarioMercadoMin ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;width:40%">Rango mercado mínimo</td><td style="padding:6px 10px;border:1px solid #ccc">${fmt(caso.salarioMercadoMin, caso.moneda)}</td></tr>` : ''}
        ${caso.salarioMercadoMax ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600">Rango mercado máximo</td><td style="padding:6px 10px;border:1px solid #ccc">${fmt(caso.salarioMercadoMax, caso.moneda)}</td></tr>` : ''}
        ${caso.salarioSolicitado ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600">Compensación solicitada</td><td style="padding:6px 10px;border:1px solid #ccc">${fmt(caso.salarioSolicitado, caso.moneda)}</td></tr>` : ''}
        ${caso.fuenteMercado ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600">Fuente</td><td style="padding:6px 10px;border:1px solid #ccc">${caso.fuenteMercado}</td></tr>` : ''}
      </tbody>
    </table>` : '';

  // Recomendación
  const recItems = [
    { key: 'Recategorización', value: caso.rolActual && caso.rolSolicitado ? `${caso.rolActual} → ${caso.rolSolicitado}` : (caso.rolSolicitado ?? '—') },
    { key: 'Compensación solicitada', value: caso.salarioSolicitado ? fmt(caso.salarioSolicitado, caso.moneda) : '—' },
    { key: 'Justificación', value: `${caso.metricas.length} métricas clave documentadas, ${caso.proyectosCerrados.length} proyectos cerrados, ${caso.iniciativas.length} iniciativas estratégicas` },
    { key: 'Riesgo de no actuar', value: 'Riesgo de fuga de talento, pérdida de conocimiento institucional y continuidad de proyectos activos' },
  ];
  const recHtml =
    sectionHdr('Recomendación') +
    `<table style="width:100%;border-collapse:collapse;font-size:10.5pt;margin-bottom:12px">
      <tbody>
        ${recItems.map((r) => `<tr><td style="padding:7px 10px;border:1px solid #ccc;font-weight:600;width:35%;background:#f9fafb">${r.key}</td><td style="padding:7px 10px;border:1px solid #ccc">${r.value}</td></tr>`).join('')}
      </tbody>
    </table>` +
    (caso.conclusion ? `<div style="padding:12px 16px;background:#e8ecf4;border-left:5px solid #1e2d4a;font-size:11pt;font-style:italic;line-height:1.6">"${caso.conclusion}"</div>` : '');

  const periodo = [caso.fechaDesde, caso.fechaHasta].filter(Boolean).join(' – ');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Business Case – ${caso.empresa}</title>
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
      body{font-family:'Times New Roman',Georgia,serif;font-size:11pt;color:#111;background:#fff;margin:0;padding:0}
      *{box-sizing:border-box}
      table{page-break-inside:avoid}
    </style></head><body>

    <!-- COVER HEADER -->
    <div style="background:#1e2d4a;color:#fff;padding:24px 28px 20px;margin-bottom:20px;border-radius:6px">
      <div style="font-size:9pt;text-transform:uppercase;letter-spacing:2px;opacity:0.7;margin-bottom:4px">Business Case</div>
      <div style="font-size:8.5pt;text-transform:uppercase;letter-spacing:1px;opacity:0.6;margin-bottom:12px">Retención &amp; Recategorización</div>
      <div style="font-size:20pt;font-weight:bold;line-height:1.15">${nombre}</div>
      <div style="font-size:12pt;margin-top:6px;opacity:0.9">
        ${caso.empresa}${periodo ? ` · ${periodo}` : ''}
      </div>
      <div style="font-size:11pt;margin-top:4px;opacity:0.85">
        ${caso.rolActual ? caso.rolActual : ''}${caso.rolActual && caso.rolSolicitado ? ' → ' : ''}${caso.rolSolicitado ?? ''}
      </div>
    </div>

    ${caso.resumenEjecutivo ? `${sectionHdr('Resumen Ejecutivo')}<p style="font-size:10.5pt;line-height:1.6;margin:0 0 6px">${caso.resumenEjecutivo}</p>${metricasHtml}` : metricasHtml ? `${sectionHdr('Métricas Clave')}${metricasHtml}` : ''}
    ${roiHtml}
    ${retencionHtml}
    ${evidenceHtml}
    ${benchmarkHtml}
    ${recHtml}
  </body></html>`;
}

/* ==============================
   TABS
   ============================== */

type Tab = 'general' | 'metricas' | 'proyectos' | 'iniciativas' | 'competencias' | 'sueldo' | 'exportar';
const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'metricas', label: 'Métricas' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'iniciativas', label: 'Iniciativas' },
  { id: 'competencias', label: 'Competencias' },
  { id: 'sueldo', label: 'Sueldo' },
  { id: 'exportar', label: 'Exportar' },
];

/* ==============================
   EDITOR
   ============================== */

interface EditorProps {
  caso: Caso;
  onSave: (id: string, data: Partial<Caso>) => Promise<void>;
  onBack: () => void;
  isNew: boolean;
}

function CasoEditor({ caso, onSave, onBack, isNew }: EditorProps) {
  const { perfil, showToast } = useApp();
  const isMobile = useIsMobile();
  const rowStyle: React.CSSProperties = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 12 }
    : { display: 'flex', gap: 12 };
  const [tab, setTab] = useState<Tab>('general');
  const [draft, setDraft] = useState<Caso>({ ...caso });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Caso>(key: K, value: Caso[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft.id, draft);
      showToast('Caso guardado', 'success');
      if (isNew) onBack();
    } catch {
      showToast('Error al guardar', 'warn');
    } finally {
      setSaving(false);
    }
  };

  const handleExportTecnico = () => {
    const nombre = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'Sin nombre';
    const html = buildTecnicoHtml(draft, nombre);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  const handleExportBusinessCase = () => {
    const nombre = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'Sin nombre';
    const html = buildBusinessCaseHtml(draft, nombre);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', marginBottom: 4 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 10px' }}>
          <Icon name="chevronLeft" size={15} /> Volver
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', flex: 1 }}>
          {isNew ? 'Nuevo caso' : (draft.empresa || 'Sin empresa')}
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 90 }}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--color-brand)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--color-brand)' : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1 }}>
        {/* GENERAL */}
        {tab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
            <div>
              <label style={labelStyle}>Empresa *</label>
              <input style={inputStyle} value={draft.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="Nombre de la empresa" />
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rol actual</label>
                <input style={inputStyle} value={draft.rolActual ?? ''} onChange={(e) => set('rolActual', e.target.value)} placeholder="Ej: Senior Developer" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rol solicitado</label>
                <input style={inputStyle} value={draft.rolSolicitado ?? ''} onChange={(e) => set('rolSolicitado', e.target.value)} placeholder="Ej: Tech Lead" />
              </div>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Fecha desde</label>
                <input style={inputStyle} value={draft.fechaDesde ?? ''} onChange={(e) => set('fechaDesde', e.target.value)} placeholder="Ej: Ene 2023" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Fecha hasta</label>
                <input style={inputStyle} value={draft.fechaHasta ?? ''} onChange={(e) => set('fechaHasta', e.target.value)} placeholder="Ej: Dic 2024" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Resumen ejecutivo</label>
              <textarea style={textareaStyle} value={draft.resumenEjecutivo ?? ''} onChange={(e) => set('resumenEjecutivo', e.target.value)} placeholder="Describí el contexto y objetivos del caso..." />
            </div>
            <div>
              <label style={labelStyle}>Conclusión</label>
              <textarea style={textareaStyle} value={draft.conclusion ?? ''} onChange={(e) => set('conclusion', e.target.value)} placeholder="Conclusión o frase de cierre para el documento..." />
            </div>
          </div>
        )}

        {/* MÉTRICAS */}
        {tab === 'metricas' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Definí los KPIs y logros cuantificables de este período.
            </div>
            {/* Preview chips */}
            {draft.metricas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {draft.metricas.map((m) => (
                  <div key={m.id} style={{ border: '2px solid var(--color-brand)', borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-brand)', lineHeight: 1 }}>{m.valor}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: 'var(--text)' }}>{m.etiqueta}</div>
                    {m.subtitulo && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.subtitulo}</div>}
                  </div>
                ))}
              </div>
            )}
            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {draft.metricas.map((m, idx) => (
                <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 10, background: 'var(--surface-raised)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Etiqueta</label>
                    <input style={inputStyle} value={m.etiqueta} onChange={(e) => {
                      const updated = draft.metricas.map((x, i) => i === idx ? { ...x, etiqueta: e.target.value } : x);
                      set('metricas', updated);
                    }} placeholder="Ej: Proyectos cerrados" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Valor</label>
                    <input style={inputStyle} value={m.valor} onChange={(e) => {
                      const updated = draft.metricas.map((x, i) => i === idx ? { ...x, valor: e.target.value } : x);
                      set('metricas', updated);
                    }} placeholder="Ej: 4" />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Subtítulo (opcional)</label>
                    <input style={inputStyle} value={m.subtitulo ?? ''} onChange={(e) => {
                      const updated = draft.metricas.map((x, i) => i === idx ? { ...x, subtitulo: e.target.value } : x);
                      set('metricas', updated);
                    }} placeholder="Ej: end-to-end" />
                  </div>
                  <button className="btn btn-ghost" style={{ marginTop: 18, padding: '6px 8px' }} onClick={() => set('metricas', draft.metricas.filter((_, i) => i !== idx))}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => set('metricas', [...draft.metricas, { id: newId(), etiqueta: '', valor: '', subtitulo: '' }])}>
              <Icon name="plus" size={14} /> Agregar métrica
            </button>
          </div>
        )}

        {/* PROYECTOS */}
        {tab === 'proyectos' && (
          <div style={{ maxWidth: 900 }}>
            {/* Proyectos cerrados */}
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Proyectos cerrados</div>
            {draft.proyectosCerrados.length > 0 && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-muted)' }}>
                      {['Cliente', 'Escala', 'Ejecución técnica', 'Impacto clave', 'Destacado', ''].map((h) => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {draft.proyectosCerrados.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        {(['cliente', 'escala', 'ejecucion', 'impacto'] as const).map((field) => (
                          <td key={field} style={{ padding: '6px 8px' }}>
                            <input
                              style={{ ...inputStyle, padding: '4px 6px', fontSize: 12 }}
                              value={(p[field] as string) ?? ''}
                              onChange={(e) => {
                                const updated = draft.proyectosCerrados.map((x, i) => i === idx ? { ...x, [field]: e.target.value } : x);
                                set('proyectosCerrados', updated);
                              }}
                              placeholder={field === 'cliente' ? 'Nombre del cliente' : ''}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input type="checkbox" checked={!!p.destacado} onChange={(e) => {
                            const updated = draft.proyectosCerrados.map((x, i) => i === idx ? { ...x, destacado: e.target.checked } : x);
                            set('proyectosCerrados', updated);
                          }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <button className="btn btn-ghost" style={{ padding: '4px 6px' }} onClick={() => set('proyectosCerrados', draft.proyectosCerrados.filter((_, i) => i !== idx))}>
                            <Icon name="trash" size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="btn btn-ghost" style={{ marginBottom: 28 }} onClick={() => set('proyectosCerrados', [...draft.proyectosCerrados, { id: newId(), cliente: '', escala: '', ejecucion: '', impacto: '', destacado: false }])}>
              <Icon name="plus" size={14} /> Agregar proyecto cerrado
            </button>

            {/* Proyectos activos */}
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Proyectos en curso</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {draft.proyectosActivos.map((p, idx) => (
                <div key={p.id} style={{ padding: 12, background: 'var(--surface-raised)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Nombre del proyecto</label>
                      <input style={inputStyle} value={p.nombre} onChange={(e) => {
                        const updated = draft.proyectosActivos.map((x, i) => i === idx ? { ...x, nombre: e.target.value } : x);
                        set('proyectosActivos', updated);
                      }} />
                    </div>
                    <button className="btn btn-ghost" style={{ marginTop: 18, padding: '6px 8px' }} onClick={() => set('proyectosActivos', draft.proyectosActivos.filter((_, i) => i !== idx))}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  <label style={labelStyle}>Bullets (uno por línea)</label>
                  <textarea
                    style={{ ...textareaStyle, minHeight: 60 }}
                    value={p.bullets.join('\n')}
                    onChange={(e) => {
                      const updated = draft.proyectosActivos.map((x, i) => i === idx ? { ...x, bullets: e.target.value.split('\n') } : x);
                      set('proyectosActivos', updated);
                    }}
                    placeholder="Describí el estado, tecnología y avance..."
                  />
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => set('proyectosActivos', [...draft.proyectosActivos, { id: newId(), nombre: '', bullets: [] }])}>
              <Icon name="plus" size={14} /> Agregar proyecto activo
            </button>
          </div>
        )}

        {/* INICIATIVAS */}
        {tab === 'iniciativas' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {draft.iniciativas.map((ini, idx) => (
                <div key={ini.id} style={{ padding: 14, background: 'var(--surface-raised)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Iniciativa {idx + 1}</div>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => set('iniciativas', draft.iniciativas.filter((_, i) => i !== idx))}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Nombre</label>
                      <input style={inputStyle} value={ini.nombre} onChange={(e) => {
                        const updated = draft.iniciativas.map((x, i) => i === idx ? { ...x, nombre: e.target.value } : x);
                        set('iniciativas', updated);
                      }} placeholder="Ej: Migración a microservicios" />
                    </div>
                    <div>
                      <label style={labelStyle}>Descripción</label>
                      <input style={inputStyle} value={ini.descripcion ?? ''} onChange={(e) => {
                        const updated = draft.iniciativas.map((x, i) => i === idx ? { ...x, descripcion: e.target.value } : x);
                        set('iniciativas', updated);
                      }} placeholder="Contexto breve" />
                    </div>
                    <div>
                      <label style={labelStyle}>Bullets (uno por línea)</label>
                      <textarea
                        style={{ ...textareaStyle, minHeight: 60 }}
                        value={ini.bullets.join('\n')}
                        onChange={(e) => {
                          const updated = draft.iniciativas.map((x, i) => i === idx ? { ...x, bullets: e.target.value.split('\n') } : x);
                          set('iniciativas', updated);
                        }}
                        placeholder="Detalles de la iniciativa..."
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Resultado destacado</label>
                      <input style={inputStyle} value={ini.resultado ?? ''} onChange={(e) => {
                        const updated = draft.iniciativas.map((x, i) => i === idx ? { ...x, resultado: e.target.value } : x);
                        set('iniciativas', updated);
                      }} placeholder="Ej: Reducción del 40% en tiempo de deploy" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => set('iniciativas', [...draft.iniciativas, { id: newId(), nombre: '', descripcion: '', bullets: [], resultado: '' }])}>
              <Icon name="plus" size={14} /> Agregar iniciativa
            </button>
          </div>
        )}

        {/* COMPETENCIAS */}
        {tab === 'competencias' && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  if (perfil) {
                    set('competenciasTecnicas', [...new Set([...draft.competenciasTecnicas, ...(perfil.stack ?? [])])]);
                    set('competenciasBlandas', [...new Set([...draft.competenciasBlandas, ...(perfil.habilidadesBlandas ?? [])])]);
                    showToast('Importado desde perfil', 'success');
                  }
                }}
              >
                <Icon name="user" size={14} /> Importar desde perfil
              </button>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Técnicas</label>
                <ChipInput
                  value={draft.competenciasTecnicas}
                  onChange={(v) => set('competenciasTecnicas', v)}
                  placeholder="React, Node.js… (Enter para agregar)"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Blandas</label>
                <ChipInput
                  value={draft.competenciasBlandas}
                  onChange={(v) => set('competenciasBlandas', v)}
                  placeholder="Liderazgo, comunicación… (Enter)"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUELDO */}
        {tab === 'sueldo' && (
          <div style={{ maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Salario actual</label>
                <input style={inputStyle} type="number" value={draft.salarioActual ?? ''} onChange={(e) => set('salarioActual', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Salario solicitado</label>
                <input style={inputStyle} type="number" value={draft.salarioSolicitado ?? ''} onChange={(e) => set('salarioSolicitado', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
              </div>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rango mercado mínimo</label>
                <input style={inputStyle} type="number" value={draft.salarioMercadoMin ?? ''} onChange={(e) => set('salarioMercadoMin', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rango mercado máximo</label>
                <input style={inputStyle} type="number" value={draft.salarioMercadoMax ?? ''} onChange={(e) => set('salarioMercadoMax', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
              </div>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Moneda</label>
                <select style={inputStyle} value={draft.moneda} onChange={(e) => set('moneda', e.target.value)}>
                  {['ARS', 'USD', 'EUR'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Fuente de referencia</label>
                <input style={inputStyle} value={draft.fuenteMercado ?? ''} onChange={(e) => set('fuenteMercado', e.target.value)} placeholder="Ej: Glassdoor, LinkedIn Salary, encuesta de mercado" />
              </div>
            </div>
          </div>
        )}

        {/* EXPORTAR */}
        {tab === 'exportar' && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Generá los documentos PDF a partir de los datos de este caso. Acordate de guardar primero.
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Documento Técnico */}
              <div style={{ flex: 1, minWidth: 220, padding: 20, background: 'var(--surface-raised)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon name="file" size={20} stroke="var(--color-brand)" />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Documento Técnico</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                  Para tu jefe directo. Detalla proyectos, iniciativas, competencias y logros técnicos.
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportTecnico}>
                  <Icon name="download" size={14} stroke="white" /> Generar PDF Técnico
                </button>
              </div>

              {/* Business Case */}
              <div style={{ flex: 1, minWidth: 220, padding: 20, background: 'var(--surface-raised)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon name="star" size={20} stroke="var(--color-brand)" />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Business Case</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                  Para C-level. Enfocado en ROI, costo de reemplazo y valor de negocio generado.
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportBusinessCase}>
                  <Icon name="download" size={14} stroke="white" /> Generar Business Case
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==============================
   MAIN PAGE
   ============================== */

export function CasosPage() {
  const { casos, addCaso, updateCaso, deleteCaso, showToast } = useApp();
  const [selected, setSelected] = useState<Caso | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleNewInline = () => {
    const id = '__draft__';
    const draft: Caso = {
      id,
      createdAt: new Date().toISOString(),
      ...emptyCaso(),
    };
    setSelected(draft);
    setIsNew(true);
  };

  const handleSave = async (id: string, data: Partial<Caso>) => {
    if (isNew) {
      // Create in DB
      await addCaso(data);
      setSelected(null);
      setIsNew(false);
    } else {
      await updateCaso(id, data);
      // Reflect update locally
      setSelected((prev) => prev ? { ...prev, ...data } : prev);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCaso(id);
      showToast('Caso eliminado', 'info');
      setConfirmDelete(null);
    } catch {
      showToast('Error al eliminar', 'warn');
    }
  };

  if (selected) {
    return (
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CasoEditor
          caso={selected}
          onSave={handleSave}
          onBack={() => { setSelected(null); setIsNew(false); }}
          isNew={isNew}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px', flex: 1 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Casos</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Documentá tus logros para solicitudes de promoción o ajuste salarial.</div>
        </div>
        <button className="btn btn-primary" onClick={handleNewInline}>
          <Icon name="plus" size={14} stroke="white" /> Nuevo caso
        </button>
      </div>

      {/* List */}
      {casos.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--text-muted)' }}>
          <Icon name="award" size={48} stroke="var(--border)" />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-subtle)' }}>Aún no tenés casos</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>
            Creá tu primer caso para documentar logros y generar documentos PDF listos para presentar.
          </div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleNewInline}>
            <Icon name="plus" size={14} stroke="white" /> Crear primer caso
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {casos.map((caso) => {
            const confirming = confirmDelete === caso.id;
            return (
              <div key={caso.id} style={{ padding: '16px 18px', background: 'var(--surface-raised)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="award" size={18} stroke="var(--color-brand)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {caso.empresa || 'Sin empresa'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {caso.rolActual && <span>{caso.rolActual}</span>}
                      {caso.rolActual && caso.rolSolicitado && <span style={{ color: 'var(--text-subtle)' }}> → </span>}
                      {caso.rolSolicitado && <span style={{ fontWeight: 600, color: 'var(--color-brand)' }}>{caso.rolSolicitado}</span>}
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(caso.fechaDesde || caso.fechaHasta) && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', background: 'var(--surface-muted)', padding: '2px 8px', borderRadius: 4 }}>
                      {[caso.fechaDesde, caso.fechaHasta].filter(Boolean).join(' – ')}
                    </span>
                  )}
                  {caso.metricas.length > 0 && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', background: 'var(--surface-muted)', padding: '2px 8px', borderRadius: 4 }}>
                      {caso.metricas.length} métrica{caso.metricas.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {caso.proyectosCerrados.length > 0 && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', background: 'var(--surface-muted)', padding: '2px 8px', borderRadius: 4 }}>
                      {caso.proyectosCerrados.length} proyecto{caso.proyectosCerrados.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    onClick={() => setSelected(caso)}
                  >
                    <Icon name="edit" size={13} /> Editar
                  </button>
                  {confirming ? (
                    <>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12, height: 'auto' }} onClick={() => handleDelete(caso.id)}>
                        ¿Confirmar?
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '4px 6px', height: 'auto' }} onClick={() => setConfirmDelete(null)}>
                        <Icon name="x" size={11} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', color: 'var(--text-subtle)' }}
                      onClick={() => setConfirmDelete(caso.id)}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

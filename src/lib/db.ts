import { supabase } from './supabase';
import type {
  Empresa,
  Oferta,
  Contacto,
  PerfilUsuario,
  ActivityItem,
  NotaItem,
  CvItem,
  PasoRoadmap,
} from '../components/jobit/types';

// ---------- Mappers ----------

function mapEmpresa(row: Record<string, unknown>): Empresa {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    rubro: (row.rubro as string) ?? '',
    tamaño: (row['tamaño'] as Empresa['tamaño']) ?? 'startup',
    pais: (row.pais as string) ?? '',
    logo: (row.logo as string) ?? '',
    color: (row.color as string) ?? 'oklch(0.55 0.12 250)',
    glassdoor: row.glassdoor != null ? (row.glassdoor as number) : null,
  };
}

function mapContacto(row: Record<string, unknown>): Contacto {
  const nombre = `${row.nombre as string} ${(row.apellido as string) ?? ''}`.trim();
  const initials = nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
  const empId = row.empresa_id as string;
  // Color derived from empresa or default
  const empRow = row.empresa as Record<string, unknown> | null;
  const color = empRow ? (empRow.color as string) : 'oklch(0.55 0.16 250)';
  return {
    id: row.id as string,
    nombre,
    rol: (row.rol as string) ?? '',
    empresa: empId ?? '',
    email: (row.email as string) ?? '',
    linkedin: (row.linkedin as string) ?? '',
    avatar: initials,
    color,
  };
}

function mapCV(row: Record<string, unknown>): CvItem {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: (row.descripcion as string) ?? '',
    version: (row.version as string) ?? 'v1.0',
    tamano: row.size_kb != null ? `${row.size_kb as number} KB` : '',
    fecha: (row.fecha as string) ?? '',
    ofertasUsadas: 0,
    color: (row.color as string) ?? 'oklch(0.55 0.16 250)',
  };
}

function mapOferta(row: Record<string, unknown>): Oferta {
  const empresaRow = row.empresa as Record<string, unknown> | null;
  // scoring in DB is a jsonb object; compute overall score from values if possible
  const scoringObj = row.scoring as Record<string, number> | null;
  let scoring = 0;
  if (scoringObj && typeof scoringObj === 'object') {
    const vals = Object.values(scoringObj);
    if (vals.length > 0) {
      scoring = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 20);
    }
  }

  return {
    id: row.id as string,
    titulo: row.titulo as string,
    empresa: empresaRow ? (empresaRow.id as string) : (row.empresa_id as string) ?? '',
    estado: row.estado as Oferta['estado'],
    tags: (row.tags as string[]) ?? [],
    modalidad: (row.modalidad as Oferta['modalidad']) ?? 'remoto',
    tipoEmpleo: (row.tipo_empleo as Oferta['tipoEmpleo']) ?? 'full-time',
    metodoPago: (row.metodo_pago as Oferta['metodoPago']) ?? 'mensual',
    moneda: (row.moneda as Oferta['moneda']) ?? 'USD',
    salarioBrutoOfrecido: row.salario_bruto_ofrecido != null ? (row.salario_bruto_ofrecido as number) : null,
    salarioNetoOfrecido: row.salario_neto_ofrecido != null ? (row.salario_neto_ofrecido as number) : null,
    descripcionPuesto: (row.descripcion_puesto as string) ?? '',
    beneficios: (row.beneficios as string[]) ?? [],
    jornada: (row.jornada as string) ?? '40hs/semana',
    pais: (row.pais as string) ?? '',
    ciudad: (row.ciudad as string) ?? '',
    contactos: [],
    cvEnviado: row.cv_enviado_id != null ? (row.cv_enviado_id as string) : null,
    pasoActual: (row.paso_actual as number) ?? 0,
    pasosTotales: 5,
    proximaFecha: row.proxima_fecha != null ? (row.proxima_fecha as string) : null,
    scoring,
    actualizadoEn: (row.actualizado_en as string) ?? new Date().toISOString().slice(0, 10),
  };
}

function mapRoadmapPaso(row: Record<string, unknown>): PasoRoadmap {
  return {
    id: row.id as string,
    titulo: row.titulo as string,
    fecha: row.fecha != null ? (row.fecha as string) : null,
    descripcion: (row.descripcion as string) ?? '',
    estado: (row.estado as PasoRoadmap['estado']) ?? 'pendiente',
  };
}

function mapNota(row: Record<string, unknown>): NotaItem {
  return {
    id: row.id as string,
    titulo: row.titulo as string,
    contenido: (row.contenido as string) ?? '',
    tags: (row.tags as string[]) ?? [],
    creadoEn: (row.created_at as string) ?? '',
    actualizadoEn: (row.updated_at as string) ?? '',
  };
}

function mapActividadLog(row: Record<string, unknown>): ActivityItem {
  return {
    id: String(row.id as number),
    tipo: (row.tipo as string) ?? '',
    texto: (row.texto as string) ?? '',
    timestamp: (row.created_at as string) ?? '',
  };
}

function mapPerfil(row: Record<string, unknown>): PerfilUsuario {
  const nombre = (row.nombre as string) ?? '';
  const parts = nombre.trim().split(' ');
  const apellido = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return {
    nombre: parts[0] ?? nombre,
    apellido,
    email: (row.email as string) ?? '',
    telefono: '',
    linkedin: '',
    rol: (row.cargo_actual as string) ?? '',
    empresa: (row.empresa_actual as string) ?? '',
    senioridad: (row.seniority as string) ?? '',
    aniosExp: (row.anios_experiencia as number) ?? 0,
    pais: '',
    ciudad: '',
    salarioBruto: (row.salario_bruto_actual as number) ?? 0,
    salarioNeto: (row.salario_neto_actual as number) ?? 0,
    moneda: (row.moneda_actual as PerfilUsuario['moneda']) ?? 'USD',
    modalidad: (row.modalidad_actual as PerfilUsuario['modalidad']) ?? 'remoto',
    pretensionBruta: (row.pretension_min as number) ?? 0,
    pretensionNeta: (row.pretension_max as number) ?? 0,
    stack: (row.stack as string[]) ?? [],
    certificaciones: (row.certificaciones as string[]) ?? [],
  };
}

// ---------- Fetch functions ----------

export async function fetchOfertas(): Promise<Oferta[]> {
  const { data, error } = await supabase
    .from('ofertas')
    .select('*, empresa:empresas(*), cv_enviado:cvs(*)')
    .order('actualizado_en', { ascending: false });
  if (error) {
    console.warn('[jobit] fetchOfertas error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapOferta(row as Record<string, unknown>));
}

export async function fetchEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase.from('empresas').select('*');
  if (error) {
    console.warn('[jobit] fetchEmpresas error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapEmpresa(row as Record<string, unknown>));
}

export async function fetchContactos(): Promise<Contacto[]> {
  const { data, error } = await supabase
    .from('contactos')
    .select('*, empresa:empresas(*)');
  if (error) {
    console.warn('[jobit] fetchContactos error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapContacto(row as Record<string, unknown>));
}

export async function fetchCVs(): Promise<CvItem[]> {
  const { data, error } = await supabase.from('cvs').select('*');
  if (error) {
    console.warn('[jobit] fetchCVs error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapCV(row as Record<string, unknown>));
}

const DEFAULT_PERFIL: PerfilUsuario = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  linkedin: '',
  rol: '',
  empresa: '',
  senioridad: '',
  aniosExp: 0,
  pais: '',
  ciudad: '',
  salarioBruto: 0,
  salarioNeto: 0,
  moneda: 'USD',
  modalidad: 'remoto',
  pretensionBruta: 0,
  pretensionNeta: 0,
  stack: [],
  certificaciones: [],
};

export async function fetchPerfil(): Promise<PerfilUsuario> {
  // .single() errors with PGRST116 when no rows — treat that as "new user, return default"
  const { data, error } = await supabase.from('perfil_usuario').select('*').limit(1).maybeSingle();
  if (error) {
    console.warn('[jobit] fetchPerfil error (returning default):', error.message);
    return DEFAULT_PERFIL;
  }
  if (!data) return DEFAULT_PERFIL;
  return mapPerfil(data as Record<string, unknown>);
}

export async function fetchActividadLog(): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from('actividad_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.warn('[jobit] fetchActividadLog error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapActividadLog(row as Record<string, unknown>));
}

export async function fetchNotas(): Promise<NotaItem[]> {
  const { data, error } = await supabase
    .from('notas')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('[jobit] fetchNotas error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapNota(row as Record<string, unknown>));
}

export async function fetchRoadmapPasos(ofertaId: string): Promise<PasoRoadmap[]> {
  const { data, error } = await supabase
    .from('roadmap_pasos')
    .select('*')
    .eq('oferta_id', ofertaId)
    .order('orden', { ascending: true });
  if (error) {
    console.warn('[jobit] fetchRoadmapPasos error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapRoadmapPaso(row as Record<string, unknown>));
}

export async function fetchAllRoadmapPasos(): Promise<Record<string, PasoRoadmap[]>> {
  const { data, error } = await supabase
    .from('roadmap_pasos')
    .select('*')
    .order('orden', { ascending: true });
  if (error) {
    console.warn('[jobit] fetchAllRoadmapPasos error (returning empty):', error.message);
    return {};
  }
  const result: Record<string, PasoRoadmap[]> = {};
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const ofertaId = r.oferta_id as string;
    if (!result[ofertaId]) result[ofertaId] = [];
    result[ofertaId].push(mapRoadmapPaso(r));
  }
  return result;
}

export async function fetchOfertaContactos(ofertaId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('oferta_contactos')
    .select('contacto_id')
    .eq('oferta_id', ofertaId);
  if (error) {
    console.warn('[jobit] fetchOfertaContactos error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => (row as Record<string, unknown>).contacto_id as string);
}

export async function fetchAllOfertaContactos(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('oferta_contactos')
    .select('oferta_id, contacto_id');
  if (error) {
    console.warn('[jobit] fetchAllOfertaContactos error (returning empty):', error.message);
    return {};
  }
  const result: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const ofertaId = r.oferta_id as string;
    if (!result[ofertaId]) result[ofertaId] = [];
    result[ofertaId].push(r.contacto_id as string);
  }
  return result;
}

export async function fetchAdjuntos(ofertaId: string): Promise<Array<{ id: string; nombre: string; sizeKb: number; tipo: string; createdAt: string }>> {
  const { data, error } = await supabase
    .from('adjuntos')
    .select('*')
    .eq('oferta_id', ofertaId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id as number),
      nombre: r.nombre as string,
      sizeKb: (r.size_kb as number) ?? 0,
      tipo: (r.tipo as string) ?? '',
      createdAt: (r.created_at as string) ?? '',
    };
  });
}

// ---------- Write functions ----------

export async function moveOferta(id: string, nuevoEstado: string): Promise<void> {
  const { error } = await supabase
    .from('ofertas')
    .update({ estado: nuevoEstado, actualizado_en: new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) throw error;
}

export async function addOferta(data: Partial<Oferta>, userId?: string): Promise<void> {
  const newId = 'of-' + Date.now();
  const { error } = await supabase.from('ofertas').insert({
    id: newId,
    titulo: data.titulo ?? '',
    empresa_id: data.empresa ?? null,
    estado: data.estado ?? 'nueva',
    tags: data.tags ?? [],
    modalidad: data.modalidad ?? 'remoto',
    tipo_empleo: data.tipoEmpleo ?? 'full-time',
    metodo_pago: data.metodoPago ?? 'mensual',
    moneda: data.moneda ?? 'USD',
    salario_bruto_ofrecido: data.salarioBrutoOfrecido ?? null,
    salario_neto_ofrecido: data.salarioNetoOfrecido ?? null,
    descripcion_puesto: data.descripcionPuesto ?? '',
    beneficios: data.beneficios ?? [],
    jornada: data.jornada ?? '40hs/semana',
    pais: data.pais ?? '',
    ciudad: data.ciudad ?? '',
    cv_enviado_id: data.cvEnviado ?? null,
    paso_actual: data.pasoActual ?? 0,
    proxima_fecha: data.proximaFecha ?? null,
    scoring: {},
    actualizado_en: new Date().toISOString().slice(0, 10),
    user_id: userId ?? null,
  });
  if (error) throw error;
}

export async function updateScoring(id: string, key: string, val: number): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('ofertas')
    .select('scoring')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;
  const currentScoring = (current as Record<string, unknown>).scoring as Record<string, number> | null;
  const newScoring = { ...(currentScoring ?? {}), [key]: val };
  const { error } = await supabase
    .from('ofertas')
    .update({ scoring: newScoring })
    .eq('id', id);
  if (error) throw error;
}

export async function updateOferta(id: string, patch: Partial<Oferta>): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.titulo !== undefined) dbPatch.titulo = patch.titulo;
  if (patch.estado !== undefined) dbPatch.estado = patch.estado;
  if (patch.tags !== undefined) dbPatch.tags = patch.tags;
  if (patch.modalidad !== undefined) dbPatch.modalidad = patch.modalidad;
  if (patch.tipoEmpleo !== undefined) dbPatch.tipo_empleo = patch.tipoEmpleo;
  if (patch.metodoPago !== undefined) dbPatch.metodo_pago = patch.metodoPago;
  if (patch.moneda !== undefined) dbPatch.moneda = patch.moneda;
  if (patch.salarioBrutoOfrecido !== undefined) dbPatch.salario_bruto_ofrecido = patch.salarioBrutoOfrecido;
  if (patch.salarioNetoOfrecido !== undefined) dbPatch.salario_neto_ofrecido = patch.salarioNetoOfrecido;
  if (patch.descripcionPuesto !== undefined) dbPatch.descripcion_puesto = patch.descripcionPuesto;
  if (patch.beneficios !== undefined) dbPatch.beneficios = patch.beneficios;
  if (patch.jornada !== undefined) dbPatch.jornada = patch.jornada;
  if (patch.pais !== undefined) dbPatch.pais = patch.pais;
  if (patch.ciudad !== undefined) dbPatch.ciudad = patch.ciudad;
  if (patch.cvEnviado !== undefined) dbPatch.cv_enviado_id = patch.cvEnviado;
  if (patch.pasoActual !== undefined) dbPatch.paso_actual = patch.pasoActual;
  if (patch.proximaFecha !== undefined) dbPatch.proxima_fecha = patch.proximaFecha;
  dbPatch.actualizado_en = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('ofertas').update(dbPatch).eq('id', id);
  if (error) throw error;
}

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
  Plataforma,
  AdjuntoItem,
  Experiencia,
  Educacion,
  Certificacion,
  Idioma,
  Caso,
  CasoMetrica,
  CasoProyectoCerrado,
  CasoProyectoActivo,
  CasoIniciativa,
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
  // Use contact's own color if present, else derive from empresa, else default
  const empRow = row.empresa as Record<string, unknown> | null;
  const color = (row.color as string) ?? (empRow ? (empRow.color as string) : 'oklch(0.55 0.16 250)');
  return {
    id: row.id as string,
    nombre,
    rol: (row.rol as string) ?? '',
    empresa: empId ?? '',
    email: (row.email as string) ?? '',
    linkedin: (row.linkedin as string) ?? '',
    telefono: (row.telefono as string) ?? '',
    notas: (row.notas as string) ?? '',
    avatar: initials,
    color,
  };
}

function mapCV(row: Record<string, unknown>): CvItem {
  const sizeKb = (row.size_kb as number) ?? 0;
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: (row.descripcion as string) ?? '',
    version: (row.version as string) ?? '',
    tamano: sizeKb > 0 ? `${sizeKb} KB` : '',
    fecha: (row.fecha as string) ?? '',
    ofertasUsadas: 0,
    color: (row.color as string) ?? '#3B82F6',
    storagePath: (row.storage_path as string) ?? '',
    sizeKb,
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
    modalidad: (row.modalidad as Oferta['modalidad']) ?? null,
    tipoEmpleo: (row.tipo_empleo as Oferta['tipoEmpleo']) ?? null,
    metodoPago: (row.metodo_pago as Oferta['metodoPago']) ?? null,
    moneda: (row.moneda as Oferta['moneda']) ?? null,
    salarioBrutoOfrecido: row.salario_bruto_ofrecido != null ? (row.salario_bruto_ofrecido as number) : null,
    salarioNetoOfrecido: row.salario_neto_ofrecido != null ? (row.salario_neto_ofrecido as number) : null,
    pretension: row.pretension != null ? (row.pretension as number) : undefined,
    descripcionPuesto: (row.descripcion_puesto as string) ?? '',
    beneficios: (row.beneficios as string[]) ?? [],
    jornada: (row.jornada as string) ?? null,
    pais: (row.pais as string) ?? '',
    ciudad: (row.ciudad as string) ?? '',
    contactos: [],
    cvEnviado: row.cv_enviado_id != null ? (row.cv_enviado_id as string) : null,
    cvEnviadoId: row.cv_enviado_id != null ? (row.cv_enviado_id as string) : null,
    pasoActual: (row.paso_actual as number) ?? 0,
    pasosTotales: (row.pasos_totales as number) ?? 5,
    fechaInicio: row.proxima_fecha != null ? (row.proxima_fecha as string) : null,
    pasos: Array.isArray(row.pasos) ? (row.pasos as PasoRoadmap[]).map((paso) => {
      if (paso.estado === undefined) {
        paso.estado = (paso as unknown as { completado?: boolean }).completado ? 'completado' : 'pendiente';
      }
      return paso;
    }) : [],
    scoring,
    actualizadoEn: (row.actualizado_en as string) ?? new Date().toISOString().slice(0, 10),
  };
}

function mapRoadmapPaso(row: Record<string, unknown>): PasoRoadmap {
  let estado = row.estado as PasoRoadmap['estado'] | undefined;
  if (estado === undefined) {
    estado = row.completado ? 'completado' : 'pendiente';
  }
  return {
    id: row.id as string,
    titulo: row.titulo as string,
    fecha: row.fecha != null ? (row.fecha as string) : undefined,
    descripcion: (row.descripcion as string) ?? '',
    estado,
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
    ofertaId: row.oferta_id as string | undefined,
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
  const apellido = (row.apellido as string) ?? '';

  // Helper: jsonb columns may come back as a parsed array OR as a JSON string (if saved with JSON.stringify)
  const parseJsonb = (raw: unknown): unknown[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  };

  // certificaciones: prefer certificaciones_data (jsonb) over legacy text[] column
  const rawCerts = parseJsonb(row.certificaciones_data ?? row.certificaciones);
  const certificaciones: import('../components/jobit/types').Certificacion[] = rawCerts.map((c: unknown) => {
    if (typeof c === 'string') return { id: crypto.randomUUID(), titulo: c };
    const obj = c as Record<string, unknown>;
    return {
      id: (obj.id as string) ?? crypto.randomUUID(),
      titulo: (obj.titulo as string) ?? '',
      emisor: (obj.emisor as string) ?? undefined,
      fecha: (obj.fecha as string) ?? undefined,
      url: (obj.url as string) ?? undefined,
    };
  });

  // idiomas: stored as jsonb array
  const idiomas: import('../components/jobit/types').Idioma[] = parseJsonb(row.idiomas).map((i: unknown) => {
    const obj = i as Record<string, unknown>;
    return {
      nombre: (obj.nombre as string) ?? '',
      nivel: (obj.nivel as import('../components/jobit/types').Idioma['nivel']) ?? 'básico',
    };
  });

  return {
    nombre,
    apellido,
    email: (row.email as string) ?? '',
    telefono: '',
    linkedin: (row.linkedin as string) ?? '',
    github: (row.github as string) ?? '',
    ubicacion: (row.ubicacion as string) ?? '',
    rol: (row.rol_actual as string) ?? (row.cargo_actual as string) ?? '',
    empresa: (row.empresa_actual as string) ?? '',
    senioridad: (row.seniority as string) ?? '',
    aniosExp: (row.anios_experiencia as number) ?? 0,
    pais: (row.ubicacion as string) ?? '',
    ciudad: '',
    salarioBruto: (row.salario_bruto_actual as number) ?? 0,
    salarioNeto: (row.salario_neto_actual as number) ?? 0,
    moneda: (row.moneda_actual as PerfilUsuario['moneda']) ?? 'USD',
    modalidad: (row.modalidad_actual as PerfilUsuario['modalidad']) ?? 'remoto',
    metodoPago: (row.metodo_pago as PerfilUsuario['metodoPago']) ?? 'mensual',
    pretensionBruta: (row.pretension_min as number) ?? 0,
    pretensionNeta: (row.pretension_neta as number) ?? 0,
    stack: (row.stack as string[]) ?? [],
    habilidadesBlandas: (row.habilidades_blandas as string[]) ?? [],
    idiomas,
    certificaciones,
    avatarUrl: (row.avatar_url as string) ?? undefined,
    sobreMi: (row.sobre_mi as string) ?? undefined,
    emailContacto: (row.email_contacto as string) ?? undefined,
  };
}

function mapExperiencia(row: Record<string, unknown>): Experiencia {
  return {
    id: row.id as string,
    empresa: (row.empresa as string) ?? '',
    rol: (row.rol as string) ?? '',
    fechaInicio: (row.fecha_inicio as string) ?? undefined,
    fechaFin: (row.fecha_fin as string) ?? undefined,
    actual: (row.actual as boolean) ?? false,
    modalidad: (row.modalidad as string) ?? undefined,
    descripcion: (row.descripcion as string) ?? undefined,
  };
}

function mapEducacion(row: Record<string, unknown>): Educacion {
  return {
    id: row.id as string,
    instituto: (row.instituto as string) ?? '',
    titulo: (row.titulo as string) ?? '',
    descripcion: (row.descripcion as string) ?? undefined,
    fechaInicio: (row.fecha_inicio as string) ?? undefined,
    fechaFin: (row.fecha_fin as string) ?? undefined,
    actual: (row.actual as boolean) ?? false,
  };
}

function mapPlataforma(row: Record<string, unknown>): Plataforma {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    url: (row.url as string) ?? undefined,
    color: (row.color as string) ?? '#3B82F6',
    logo: (row.logo as string) ?? undefined,
    descripcion: (row.descripcion as string) ?? undefined,
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
  github: '',
  ubicacion: '',
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
  metodoPago: 'mensual',
  pretensionBruta: 0,
  pretensionNeta: 0,
  stack: [],
  habilidadesBlandas: [],
  idiomas: [],
  certificaciones: [],
  avatarUrl: undefined,
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

export async function fetchAdjuntos(ofertaId: string): Promise<AdjuntoItem[]> {
  const { data, error } = await supabase
    .from('adjuntos')
    .select('*')
    .eq('oferta_id', ofertaId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[jobit] fetchAdjuntos error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as number,
      nombre: r.nombre as string,
      sizeKb: (r.size_kb as number) ?? 0,
      tipo: (r.tipo as string) ?? '',
      storagePath: (r.storage_path as string) ?? '',
      createdAt: (r.created_at as string) ?? '',
    };
  });
}

export async function uploadAdjunto(file: File, ofertaId: string, userId: string): Promise<AdjuntoItem> {
  const path = `${userId}/${ofertaId}/${Date.now()}_${file.name}`;
  const { error: storageError } = await supabase.storage
    .from('adjuntos')
    .upload(path, file);
  if (storageError) throw new Error(`Error al subir archivo: ${storageError.message}`);

  const { data, error: insertError } = await supabase
    .from('adjuntos')
    .insert({
      oferta_id: ofertaId,
      nombre: file.name,
      size_kb: Math.round(file.size / 1024),
      tipo: file.type,
      storage_path: path,
    })
    .select()
    .single();
  if (insertError) throw new Error(`Error al guardar adjunto: ${insertError.message}`);
  const r = data as Record<string, unknown>;
  return {
    id: r.id as number,
    nombre: r.nombre as string,
    sizeKb: (r.size_kb as number) ?? 0,
    tipo: (r.tipo as string) ?? '',
    storagePath: (r.storage_path as string) ?? '',
    createdAt: (r.created_at as string) ?? '',
  };
}

export async function deleteAdjunto(id: number, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from('adjuntos')
    .remove([storagePath]);
  if (storageError) console.warn('[jobit] deleteAdjunto storage error:', storageError.message);
  const { error } = await supabase.from('adjuntos').delete().eq('id', id);
  if (error) throw new Error(`Error al eliminar adjunto: ${error.message}`);
}

export async function getAdjuntoUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('adjuntos')
    .createSignedUrl(storagePath, 3600);
  if (error) throw new Error(`Error al obtener URL: ${error.message}`);
  return data.signedUrl;
}

// ---------- Write functions ----------

export async function moveOferta(id: string, nuevoEstado: string): Promise<void> {
  const { error } = await supabase
    .from('ofertas')
    .update({ estado: nuevoEstado, actualizado_en: new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) throw error;
}

export async function addOferta(data: Omit<Oferta, 'id'> & { id?: string }, userId?: string): Promise<Oferta> {
  const id = data.id && data.id !== '' ? data.id : crypto.randomUUID();
  const { error } = await supabase.from('ofertas').insert({
    id,
    titulo: data.titulo ?? '',
    empresa_id: data.empresa ?? null,
    estado: data.estado ?? 'recibida',
    tags: data.tags ?? [],
    modalidad: data.modalidad ?? null,
    tipo_empleo: data.tipoEmpleo ?? null,
    metodo_pago: data.metodoPago ?? null,
    moneda: data.moneda ?? null,
    salario_bruto_ofrecido: data.salarioBrutoOfrecido ?? null,
    salario_neto_ofrecido: data.salarioNetoOfrecido ?? null,
    pretension: data.pretension ?? null,
    descripcion_puesto: data.descripcionPuesto ?? '',
    beneficios: data.beneficios ?? [],
    jornada: data.jornada ?? null,
    pais: data.pais ?? '',
    ciudad: data.ciudad ?? '',
    cv_enviado_id: data.cvEnviado ?? null,
    paso_actual: data.pasoActual ?? 0,
    proxima_fecha: data.fechaInicio ?? null,
    scoring: {},
    actualizado_en: new Date().toISOString().slice(0, 10),
    user_id: userId ?? null,
  });
  if (error) {
    console.error('[addOferta] Supabase error:', error);
    throw error;
  }
  return { ...data, id };
}

export async function updateScoring(id: string, key: string, val: number | null): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('ofertas')
    .select('scoring')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;
  const currentScoring = (current as Record<string, unknown>).scoring as Record<string, number | null> | null;
  const newScoring: Record<string, number | null> = { ...(currentScoring ?? {}) };
  if (val === null) {
    delete newScoring[key];
  } else {
    newScoring[key] = val;
  }
  const { error } = await supabase
    .from('ofertas')
    .update({ scoring: newScoring })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteOferta(id: string): Promise<void> {
  const { error } = await supabase.from('ofertas').delete().eq('id', id);
  if (error) throw error;
}

export async function addEmpresa(data: Omit<Empresa, 'id' | 'logo' | 'tamaño'> & { id?: string; industria?: string; web?: string; notas?: string; color?: string }): Promise<Empresa> {
  const id = data.id ?? `emp-${Date.now()}`;
  const color = data.color ?? '#3B82F6';
  const glassdoor = data.glassdoor ?? null;
  const rubro = data.industria ?? data.rubro ?? '';
  const { error } = await supabase.from('empresas').insert({
    id,
    nombre: data.nombre,
    rubro,
    tamaño: 'startup',
    pais: data.pais ?? '',
    logo: data.nombre.slice(0, 2).toUpperCase(),
    color,
    glassdoor,
  });
  if (error) throw error;
  return {
    id,
    nombre: data.nombre,
    rubro,
    tamaño: 'startup',
    pais: data.pais ?? '',
    logo: data.nombre.slice(0, 2).toUpperCase(),
    color,
    glassdoor,
  };
}

export async function updateEmpresa(id: string, data: Partial<Empresa>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.nombre !== undefined) patch.nombre = data.nombre;
  if (data.rubro !== undefined) patch.rubro = data.rubro;
  if (data.pais !== undefined) patch.pais = data.pais;
  if (data.color !== undefined) patch.color = data.color;
  if (data.glassdoor !== undefined) patch.glassdoor = data.glassdoor;
  if (data.tamaño !== undefined) patch['tamaño'] = data.tamaño;
  const { error } = await supabase.from('empresas').update(patch).eq('id', id);
  if (error) throw error;
}

export async function addNota(data: { titulo: string; contenido: string; ofertaId?: string }): Promise<NotaItem> {
  const id = `nota-${Date.now()}`;
  const now = new Date().toISOString();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('notas').insert({
    id,
    titulo: data.titulo,
    contenido: data.contenido ?? '',
    tags: [],
    oferta_id: data.ofertaId ?? null,
    created_at: now,
    updated_at: now,
    user_id: user?.id ?? null,
  });
  if (error) throw error;
  return {
    id,
    titulo: data.titulo,
    contenido: data.contenido ?? '',
    tags: [],
    ofertaId: data.ofertaId,
    creadoEn: now,
    actualizadoEn: now,
  };
}

export async function deleteEmpresa(id: string): Promise<void> {
  const { error } = await supabase.from('empresas').delete().eq('id', id);
  if (error) throw error;
}

export async function addContacto(data: {
  nombre: string;
  apellido?: string;
  rol?: string;
  empresaId?: string;
  email?: string;
  linkedin?: string;
  telefono?: string;
  notas?: string;
  color?: string;
}): Promise<Contacto> {
  const id = crypto.randomUUID();
  const color = data.color ?? '#3B82F6';
  const nombreParts = data.nombre.trim().split(' ');
  const nombre = nombreParts[0];
  const apellido = data.apellido ?? (nombreParts.length > 1 ? nombreParts.slice(1).join(' ') : '');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('contactos').insert({
    id,
    nombre,
    apellido,
    rol: data.rol ?? '',
    empresa_id: data.empresaId ?? null,
    email: data.email ?? '',
    linkedin: data.linkedin ?? '',
    telefono: data.telefono ?? '',
    notas: data.notas ?? '',
    color,
    user_id: user?.id ?? null,
  });
  if (error) throw error;
  const fullNombre = `${nombre} ${apellido}`.trim();
  const initials = fullNombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
  return {
    id,
    nombre: fullNombre,
    rol: data.rol ?? '',
    empresa: data.empresaId ?? '',
    email: data.email ?? '',
    linkedin: data.linkedin ?? '',
    telefono: data.telefono ?? '',
    notas: data.notas ?? '',
    avatar: initials,
    color,
  };
}

export async function updateContacto(id: string, data: Partial<Contacto> & { empresaId?: string }): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.nombre !== undefined) {
    const parts = data.nombre.trim().split(' ');
    patch.nombre = parts[0];
    patch.apellido = parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
  if (data.rol !== undefined) patch.rol = data.rol;
  if (data.empresaId !== undefined) patch.empresa_id = data.empresaId;
  if (data.empresa !== undefined && data.empresaId === undefined) patch.empresa_id = data.empresa;
  if (data.email !== undefined) patch.email = data.email;
  if (data.linkedin !== undefined) patch.linkedin = data.linkedin;
  if (data.telefono !== undefined) patch.telefono = data.telefono;
  if (data.notas !== undefined) patch.notas = data.notas;
  if (data.color !== undefined) patch.color = data.color;
  const { error } = await supabase.from('contactos').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteContacto(id: string): Promise<void> {
  const { error } = await supabase.from('contactos').delete().eq('id', id);
  if (error) throw error;
}

export async function updateNota(id: string, patch: { titulo?: string; contenido?: string }): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('notas')
    .update({ ...patch, updated_at: now })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteNota(id: string): Promise<void> {
  const { error } = await supabase.from('notas').delete().eq('id', id);
  if (error) throw error;
}

export async function addOfertaContacto(ofertaId: string, contactoId: string): Promise<void> {
  const { error } = await supabase
    .from('oferta_contactos')
    .upsert({ oferta_id: ofertaId, contacto_id: contactoId }, { onConflict: 'oferta_id,contacto_id' });
  if (error) throw error;
}

export async function removeOfertaContacto(ofertaId: string, contactoId: string): Promise<void> {
  const { error } = await supabase
    .from('oferta_contactos')
    .delete()
    .eq('oferta_id', ofertaId)
    .eq('contacto_id', contactoId);
  if (error) throw error;
}

export async function fetchPlataformas(userId?: string): Promise<Record<string, Plataforma>> {
  let query = supabase.from('plataformas').select('*');
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) {
    console.warn('[jobit] fetchPlataformas error (returning empty):', error.message);
    return {};
  }
  const result: Record<string, Plataforma> = {};
  for (const row of data ?? []) {
    const p = mapPlataforma(row as Record<string, unknown>);
    result[p.id] = p;
  }
  return result;
}

export async function addPlataforma(
  data: Omit<Plataforma, 'id'>,
  userId?: string,
): Promise<Plataforma> {
  const id = crypto.randomUUID();
  const logo = data.nombre.slice(0, 2).toUpperCase();
  const { error } = await supabase.from('plataformas').insert({
    id,
    nombre: data.nombre,
    url: data.url ?? null,
    color: data.color ?? '#3B82F6',
    logo,
    descripcion: data.descripcion ?? null,
    user_id: userId ?? null,
  });
  if (error) throw error;
  return { ...data, id, logo };
}

export async function updatePlataforma(id: string, data: Partial<Plataforma>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.nombre !== undefined) {
    patch.nombre = data.nombre;
    patch.logo = data.nombre.slice(0, 2).toUpperCase();
  }
  if (data.url !== undefined) patch.url = data.url;
  if (data.color !== undefined) patch.color = data.color;
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
  const { error } = await supabase.from('plataformas').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePlataforma(id: string): Promise<void> {
  const { error } = await supabase.from('plataformas').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadCV(
  file: File,
  userId: string,
  meta: { nombre: string; version?: string; descripcion?: string; color?: string },
): Promise<CvItem> {
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error: storageError } = await supabase.storage
    .from('cvs')
    .upload(path, file);
  if (storageError) throw new Error(`Error al subir CV: ${storageError.message}`);

  const id = crypto.randomUUID();
  const sizeKb = Math.round(file.size / 1024);
  const fecha = new Date().toISOString().split('T')[0];
  const color = meta.color ?? '#3B82F6';

  const { data, error: insertError } = await supabase
    .from('cvs')
    .insert({
      id,
      nombre: meta.nombre || file.name,
      version: meta.version ?? null,
      descripcion: meta.descripcion ?? null,
      size_kb: sizeKb,
      fecha,
      color,
      storage_path: path,
      user_id: userId,
    })
    .select()
    .single();
  if (insertError) throw new Error(`Error al guardar CV: ${insertError.message}`);

  return mapCV(data as Record<string, unknown>);
}

export async function deleteCV(id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from('cvs')
    .remove([storagePath]);
  if (storageError) console.warn('[jobit] deleteCV storage error:', storageError.message);
  const { error } = await supabase.from('cvs').delete().eq('id', id);
  if (error) throw new Error(`Error al eliminar CV: ${error.message}`);
}

export async function getCVUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('cvs')
    .createSignedUrl(storagePath, 3600);
  if (error) throw new Error(`Error al obtener URL del CV: ${error.message}`);
  return data.signedUrl;
}

export async function linkCVToOferta(ofertaId: string, cvId: string | null): Promise<void> {
  const { error } = await supabase
    .from('ofertas')
    .update({ cv_enviado_id: cvId, actualizado_en: new Date().toISOString().slice(0, 10) })
    .eq('id', ofertaId);
  if (error) throw new Error(`Error al vincular CV: ${error.message}`);
}

export async function updatePerfil(data: Partial<PerfilUsuario>): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('No autenticado');

  const payload: Record<string, unknown> = { user_id: user.id };
  if (data.nombre !== undefined) payload.nombre = data.nombre;
  if (data.apellido !== undefined) payload.apellido = data.apellido;
  if (data.linkedin !== undefined) payload.linkedin = data.linkedin;
  if (data.github !== undefined) payload.github = data.github;
  if (data.ubicacion !== undefined) payload.ubicacion = data.ubicacion;
  if (data.rol !== undefined) payload.cargo_actual = data.rol;
  if (data.empresa !== undefined) payload.empresa_actual = data.empresa;
  if (data.salarioBruto !== undefined) payload.salario_bruto_actual = data.salarioBruto;
  if (data.salarioNeto !== undefined) payload.salario_neto_actual = data.salarioNeto;
  if (data.moneda !== undefined) payload.moneda_actual = data.moneda;
  if (data.metodoPago !== undefined) payload.metodo_pago = data.metodoPago;
  if (data.stack !== undefined) payload.stack = data.stack;
  if (data.habilidadesBlandas !== undefined) payload.habilidades_blandas = data.habilidadesBlandas;
  if (data.idiomas !== undefined) payload.idiomas = data.idiomas;
  if (data.certificaciones !== undefined) payload.certificaciones_data = data.certificaciones;
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
  if (data.sobreMi !== undefined) payload.sobre_mi = data.sobreMi ?? null;
  if (data.emailContacto !== undefined) payload.email_contacto = data.emailContacto || null;

  console.log('[updatePerfil] payload:', payload);

  const { error } = await supabase
    .from('perfil_usuario')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.error('[updatePerfil] error:', error);
    throw new Error(error.message);
  }
}

export async function fetchExperiencia(userId: string): Promise<Experiencia[]> {
  const { data, error } = await supabase
    .from('experiencia')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[fetchExperiencia] error:', error);
    return [];
  }
  return (data ?? []).map((row) => mapExperiencia(row as Record<string, unknown>));
}

export async function addExperiencia(
  data: Omit<Experiencia, 'id'>,
  userId: string,
): Promise<Experiencia> {
  const id = crypto.randomUUID();
  const { error } = await supabase.from('experiencia').insert({
    id,
    user_id: userId,
    empresa: data.empresa,
    rol: data.rol,
    fecha_inicio: data.fechaInicio ?? null,
    fecha_fin: data.fechaFin ?? null,
    actual: data.actual ?? false,
    modalidad: data.modalidad ?? null,
    descripcion: data.descripcion ?? null,
  });
  if (error) throw new Error(`Error al agregar experiencia: ${error.message}`);
  return { ...data, id };
}

export async function updateExperiencia(id: string, data: Partial<Experiencia>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.empresa !== undefined) patch.empresa = data.empresa;
  if (data.rol !== undefined) patch.rol = data.rol;
  if (data.fechaInicio !== undefined) patch.fecha_inicio = data.fechaInicio;
  if (data.fechaFin !== undefined) patch.fecha_fin = data.fechaFin;
  if (data.actual !== undefined) patch.actual = data.actual;
  if (data.modalidad !== undefined) patch.modalidad = data.modalidad;
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
  const { error } = await supabase.from('experiencia').update(patch).eq('id', id);
  if (error) throw new Error(`Error al actualizar experiencia: ${error.message}`);
}

export async function deleteExperiencia(id: string): Promise<void> {
  const { error } = await supabase.from('experiencia').delete().eq('id', id);
  if (error) throw new Error(`Error al eliminar experiencia: ${error.message}`);
}

export async function fetchEducacion(userId: string): Promise<Educacion[]> {
  const { data, error } = await supabase
    .from('educacion')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[fetchEducacion] error:', error);
    return [];
  }
  return (data ?? []).map((row) => mapEducacion(row as Record<string, unknown>));
}

export async function addEducacion(
  data: Omit<Educacion, 'id'>,
  userId: string,
): Promise<Educacion> {
  const id = crypto.randomUUID();
  const { error } = await supabase.from('educacion').insert({
    id,
    user_id: userId,
    instituto: data.instituto,
    titulo: data.titulo,
    descripcion: data.descripcion ?? null,
    fecha_inicio: data.fechaInicio ?? null,
    fecha_fin: data.fechaFin ?? null,
    actual: data.actual ?? false,
  });
  if (error) throw new Error(`Error al agregar educación: ${error.message}`);
  return { ...data, id };
}

export async function updateEducacion(id: string, data: Partial<Educacion>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.instituto !== undefined) patch.instituto = data.instituto;
  if (data.titulo !== undefined) patch.titulo = data.titulo;
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
  if (data.fechaInicio !== undefined) patch.fecha_inicio = data.fechaInicio;
  if (data.fechaFin !== undefined) patch.fecha_fin = data.fechaFin;
  if (data.actual !== undefined) patch.actual = data.actual;
  const { error } = await supabase.from('educacion').update(patch).eq('id', id);
  if (error) throw new Error(`Error al actualizar educación: ${error.message}`);
}

export async function deleteEducacion(id: string): Promise<void> {
  const { error } = await supabase.from('educacion').delete().eq('id', id);
  if (error) throw new Error(`Error al eliminar educación: ${error.message}`);
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error: storageError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (storageError) throw new Error(`Error al subir avatar: ${storageError.message}`);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('perfil_usuario')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId);
  if (updateError) console.warn('[uploadAvatar] failed to save avatar_url to perfil:', updateError.message);

  return publicUrl;
}

// ---------- Casos ----------

function parseJsonbArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

function mapCaso(row: Record<string, unknown>): Caso {
  return {
    id: row.id as string,
    empresa: (row.empresa as string) ?? '',
    rolActual: (row.rol_actual as string) ?? undefined,
    rolSolicitado: (row.rol_solicitado as string) ?? undefined,
    fechaDesde: (row.fecha_desde as string) ?? undefined,
    fechaHasta: (row.fecha_hasta as string) ?? undefined,
    resumenEjecutivo: (row.resumen_ejecutivo as string) ?? undefined,
    conclusion: (row.conclusion as string) ?? undefined,
    metricas: parseJsonbArray(row.metricas) as CasoMetrica[],
    proyectosCerrados: parseJsonbArray(row.proyectos_cerrados) as CasoProyectoCerrado[],
    proyectosActivos: parseJsonbArray(row.proyectos_activos) as CasoProyectoActivo[],
    iniciativas: parseJsonbArray(row.iniciativas) as CasoIniciativa[],
    competenciasTecnicas: (row.competencias_tecnicas as string[]) ?? [],
    competenciasBlandas: (row.competencias_blandas as string[]) ?? [],
    salarioActual: row.salario_actual != null ? (row.salario_actual as number) : undefined,
    salarioSolicitado: row.salario_solicitado != null ? (row.salario_solicitado as number) : undefined,
    salarioMercadoMin: row.salario_mercado_min != null ? (row.salario_mercado_min as number) : undefined,
    salarioMercadoMax: row.salario_mercado_max != null ? (row.salario_mercado_max as number) : undefined,
    moneda: (row.moneda as string) ?? 'ARS',
    fuenteMercado: (row.fuente_mercado as string) ?? undefined,
    createdAt: (row.created_at as string) ?? '',
  };
}

export async function fetchCasos(userId: string): Promise<Caso[]> {
  const { data, error } = await supabase
    .from('casos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[jobit] fetchCasos error (returning empty):', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapCaso(row as Record<string, unknown>));
}

export async function addCaso(userId: string, data: Partial<Caso>): Promise<Caso> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error } = await supabase.from('casos').insert({
    id,
    user_id: userId,
    empresa: data.empresa ?? '',
    rol_actual: data.rolActual ?? null,
    rol_solicitado: data.rolSolicitado ?? null,
    fecha_desde: data.fechaDesde ?? null,
    fecha_hasta: data.fechaHasta ?? null,
    resumen_ejecutivo: data.resumenEjecutivo ?? null,
    conclusion: data.conclusion ?? null,
    metricas: data.metricas ?? [],
    proyectos_cerrados: data.proyectosCerrados ?? [],
    proyectos_activos: data.proyectosActivos ?? [],
    iniciativas: data.iniciativas ?? [],
    competencias_tecnicas: data.competenciasTecnicas ?? [],
    competencias_blandas: data.competenciasBlandas ?? [],
    salario_actual: data.salarioActual ?? null,
    salario_solicitado: data.salarioSolicitado ?? null,
    salario_mercado_min: data.salarioMercadoMin ?? null,
    salario_mercado_max: data.salarioMercadoMax ?? null,
    moneda: data.moneda ?? 'ARS',
    fuente_mercado: data.fuenteMercado ?? null,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Error al crear caso: ${error.message}`);
  return {
    id,
    empresa: data.empresa ?? '',
    rolActual: data.rolActual,
    rolSolicitado: data.rolSolicitado,
    fechaDesde: data.fechaDesde,
    fechaHasta: data.fechaHasta,
    resumenEjecutivo: data.resumenEjecutivo,
    conclusion: data.conclusion,
    metricas: data.metricas ?? [],
    proyectosCerrados: data.proyectosCerrados ?? [],
    proyectosActivos: data.proyectosActivos ?? [],
    iniciativas: data.iniciativas ?? [],
    competenciasTecnicas: data.competenciasTecnicas ?? [],
    competenciasBlandas: data.competenciasBlandas ?? [],
    salarioActual: data.salarioActual,
    salarioSolicitado: data.salarioSolicitado,
    salarioMercadoMin: data.salarioMercadoMin,
    salarioMercadoMax: data.salarioMercadoMax,
    moneda: data.moneda ?? 'ARS',
    fuenteMercado: data.fuenteMercado,
    createdAt: now,
  };
}

export async function updateCaso(id: string, data: Partial<Caso>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.empresa !== undefined) patch.empresa = data.empresa;
  if (data.rolActual !== undefined) patch.rol_actual = data.rolActual;
  if (data.rolSolicitado !== undefined) patch.rol_solicitado = data.rolSolicitado;
  if (data.fechaDesde !== undefined) patch.fecha_desde = data.fechaDesde;
  if (data.fechaHasta !== undefined) patch.fecha_hasta = data.fechaHasta;
  if (data.resumenEjecutivo !== undefined) patch.resumen_ejecutivo = data.resumenEjecutivo;
  if (data.conclusion !== undefined) patch.conclusion = data.conclusion;
  if (data.metricas !== undefined) patch.metricas = data.metricas;
  if (data.proyectosCerrados !== undefined) patch.proyectos_cerrados = data.proyectosCerrados;
  if (data.proyectosActivos !== undefined) patch.proyectos_activos = data.proyectosActivos;
  if (data.iniciativas !== undefined) patch.iniciativas = data.iniciativas;
  if (data.competenciasTecnicas !== undefined) patch.competencias_tecnicas = data.competenciasTecnicas;
  if (data.competenciasBlandas !== undefined) patch.competencias_blandas = data.competenciasBlandas;
  if (data.salarioActual !== undefined) patch.salario_actual = data.salarioActual;
  if (data.salarioSolicitado !== undefined) patch.salario_solicitado = data.salarioSolicitado;
  if (data.salarioMercadoMin !== undefined) patch.salario_mercado_min = data.salarioMercadoMin;
  if (data.salarioMercadoMax !== undefined) patch.salario_mercado_max = data.salarioMercadoMax;
  if (data.moneda !== undefined) patch.moneda = data.moneda;
  if (data.fuenteMercado !== undefined) patch.fuente_mercado = data.fuenteMercado;
  const { error } = await supabase.from('casos').update(patch).eq('id', id);
  if (error) throw new Error(`Error al actualizar caso: ${error.message}`);
}

export async function deleteCaso(id: string): Promise<void> {
  const { error } = await supabase.from('casos').delete().eq('id', id);
  if (error) throw new Error(`Error al eliminar caso: ${error.message}`);
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
  if (patch.pretension !== undefined) dbPatch.pretension = patch.pretension ?? null;
  if (patch.descripcionPuesto !== undefined) dbPatch.descripcion_puesto = patch.descripcionPuesto;
  if (patch.beneficios !== undefined) dbPatch.beneficios = patch.beneficios;
  if (patch.jornada !== undefined) dbPatch.jornada = patch.jornada;
  if (patch.pais !== undefined) dbPatch.pais = patch.pais;
  if (patch.ciudad !== undefined) dbPatch.ciudad = patch.ciudad;
  if (patch.cvEnviado !== undefined) dbPatch.cv_enviado_id = patch.cvEnviado;
  if (patch.cvEnviadoId !== undefined) dbPatch.cv_enviado_id = patch.cvEnviadoId;
  if (patch.pasoActual !== undefined) dbPatch.paso_actual = patch.pasoActual;
  if (patch.fechaInicio !== undefined) dbPatch.proxima_fecha = patch.fechaInicio;
  if (patch.pasos !== undefined) dbPatch.pasos = patch.pasos;
  dbPatch.actualizado_en = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('ofertas').update(dbPatch).eq('id', id);
  if (error) throw error;
}

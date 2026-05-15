export type EstadoOferta =
  | 'recibida'
  | 'aplicada'
  | 'pendiente'
  | 'rechazada_yo'
  | 'rechazada_empresa'
  | 'ignorada';

export type Modalidad = 'remoto' | 'hibrido' | 'presencial';
export type TipoEmpleo = 'full-time' | 'part-time' | 'freelance' | 'contrato';
export type MetodoPago = 'mensual' | 'hora' | 'proyecto' | 'por_hora' | 'por_proyecto';
export type Moneda = 'USD' | 'ARS' | 'EUR' | 'UYU' | 'BRL';

export interface Empresa {
  id: string;
  nombre: string;
  rubro: string;
  tamaño: 'startup' | 'mediana' | 'enterprise' | 'multinacional';
  pais: string;
  logo: string;
  color: string;
  glassdoor: number | null;
}

export interface PasoRoadmap {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: 'pendiente' | 'completado' | 'finalizado';
  fecha?: string;
  plataformaId?: string;  // ID of the platform used in this step
  contactoId?: string;    // ID of the contact person involved in this step
  emoji?: string;         // Optional emoji icon for the step
}

export interface Contacto {
  id: string;
  nombre: string;
  rol: string;
  empresa: string;
  email: string;
  linkedin: string;
  telefono?: string;
  notas?: string;
  avatar: string;
  color: string;
}

export interface Oferta {
  id: string;
  titulo: string;
  empresa: string;
  estado: EstadoOferta;
  tags: string[];
  modalidad: Modalidad | null;
  tipoEmpleo: TipoEmpleo | null;
  metodoPago: MetodoPago | null;
  moneda: Moneda | null;
  salarioBrutoOfrecido: number | null;
  salarioNetoOfrecido: number | null;
  descripcionPuesto: string;
  beneficios: string[];
  jornada?: string | null;
  pais?: string | null;
  ciudad?: string | null;
  contactos: string[];
  cvEnviado: string | null;
  cvEnviadoId?: string | null;
  pasoActual: number;
  pasosTotales: number;
  fechaInicio: string | null;
  pasos: PasoRoadmap[];
  scoring: number;
  actualizadoEn: string;
  url?: string;
  pretension?: number;
}

export interface ScoringDimension {
  key: string;
  label: string;
  value: number;
}

export interface PerfilUsuario {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  linkedin: string;
  github: string;
  ubicacion: string;
  rol: string;
  empresa: string;
  senioridad: string;
  aniosExp: number;
  pais: string;
  ciudad: string;
  salarioBruto: number;
  salarioNeto: number;
  moneda: Moneda;
  modalidad: Modalidad;
  metodoPago: MetodoPago;
  pretensionBruta: number;
  pretensionNeta: number;
  stack: string[];
  habilidadesBlandas: string[];
  idiomas: Idioma[];
  certificaciones: Certificacion[];
  avatarUrl?: string;
  sobreMi?: string;
  emailContacto?: string;
}

export interface Idioma {
  nombre: string;
  nivel: 'básico' | 'intermedio' | 'avanzado' | 'nativo';
}

export interface Certificacion {
  id: string;
  titulo: string;
  emisor?: string;
  fecha?: string;
  url?: string;
}

export interface Experiencia {
  id: string;
  empresa: string;
  rol: string;
  fechaInicio?: string;
  fechaFin?: string;
  actual: boolean;
  modalidad?: string;
  descripcion?: string;
}

export interface Educacion {
  id: string;
  instituto: string;
  titulo: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  actual: boolean;
}

export interface ActivityItem {
  id: string;
  tipo: string;
  texto: string;
  ofertaId?: string;
  timestamp: string;
}

export interface NotaItem {
  id: string;
  titulo: string;
  contenido: string;
  tags: string[];
  ofertaId?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CvItem {
  id: string;
  nombre: string;
  descripcion: string;
  version: string;
  tamano: string;
  fecha: string;
  ofertasUsadas: number;
  color: string;
  storagePath: string;
  sizeKb: number;
}

export interface Plataforma {
  id: string;
  nombre: string;
  url?: string;
  color: string;
  logo?: string;
  descripcion?: string;
}

export interface AdjuntoItem {
  id: number;
  nombre: string;
  sizeKb: number;
  tipo: string;
  storagePath: string;
  createdAt: string;
}

export interface CasoMetrica {
  id: string;
  etiqueta: string;
  valor: string;
  subtitulo?: string;
}

export interface CasoProyectoCerrado {
  id: string;
  cliente: string;
  escala?: string;
  ejecucion?: string;
  impacto?: string;
  destacado?: boolean;
}

export interface CasoProyectoActivo {
  id: string;
  nombre: string;
  bullets: string[];
}

export interface CasoIniciativa {
  id: string;
  nombre: string;
  descripcion?: string;
  bullets: string[];
  resultado?: string;
}

export interface Caso {
  id: string;
  empresa: string;
  rolActual?: string;
  rolSolicitado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  resumenEjecutivo?: string;
  conclusion?: string;
  metricas: CasoMetrica[];
  proyectosCerrados: CasoProyectoCerrado[];
  proyectosActivos: CasoProyectoActivo[];
  iniciativas: CasoIniciativa[];
  competenciasTecnicas: string[];
  competenciasBlandas: string[];
  salarioActual?: number;
  salarioSolicitado?: number;
  salarioMercadoMin?: number;
  salarioMercadoMax?: number;
  moneda: string;
  fuenteMercado?: string;
  createdAt: string;
}

export type Page =
  | 'dashboard'
  | 'ofertas'
  | 'oferta-detail'
  | 'comparar'
  | 'perfil'
  | 'cvs'
  | 'contactos'
  | 'empresas'
  | 'plataformas'
  | 'configuracion'
  | 'casos';

export interface Tweaks {
  hue: number;
  density: 'compact' | 'comfortable' | 'spacious';
  sidebar: 'expanded' | 'collapsed';
  card: 'default' | 'minimal' | 'detailed';
  font: 'geist' | 'inter' | 'system';
}

export type ToastVariant = 'success' | 'warn' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export type EstadoOferta =
  | 'nueva'
  | 'aplicada'
  | 'en_proceso'
  | 'oferta_recibida'
  | 'rechazada_empresa'
  | 'ghosted';

export type Modalidad = 'remoto' | 'hibrido' | 'presencial';
export type TipoEmpleo = 'full-time' | 'part-time' | 'freelance' | 'contrato';
export type MetodoPago = 'mensual' | 'hora' | 'proyecto';
export type Moneda = 'USD' | 'ARS' | 'EUR';

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
  fecha: string | null;
  descripcion: string;
  estado: 'completado' | 'actual' | 'pendiente' | 'cancelado';
  adjuntos?: string[];
}

export interface Contacto {
  id: string;
  nombre: string;
  rol: string;
  empresa: string;
  email: string;
  linkedin: string;
  avatar: string;
  color: string;
}

export interface Oferta {
  id: string;
  titulo: string;
  empresa: string;
  estado: EstadoOferta;
  tags: string[];
  modalidad: Modalidad;
  tipoEmpleo: TipoEmpleo;
  metodoPago: MetodoPago;
  moneda: Moneda;
  salarioBrutoOfrecido: number | null;
  salarioNetoOfrecido: number | null;
  descripcionPuesto: string;
  beneficios: string[];
  jornada: string;
  pais: string;
  ciudad: string;
  contactos: string[];
  cvEnviado: string | null;
  pasoActual: number;
  pasosTotales: number;
  proximaFecha: string | null;
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
  pretensionBruta: number;
  pretensionNeta: number;
  stack: string[];
  certificaciones: string[];
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
  | 'notas'
  | 'configuracion';

export interface Tweaks {
  hue: number;
  density: 'compact' | 'comfortable' | 'spacious';
  sidebar: 'expanded' | 'collapsed';
  roadmap: 'vertical' | 'stepper' | 'kanban';
  card: 'default' | 'minimal' | 'detailed';
  font: 'geist' | 'inter' | 'system';
}

export type ToastVariant = 'success' | 'warn' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

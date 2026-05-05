import type { Empresa, Oferta, Contacto, PerfilUsuario, ActivityItem, NotaItem, CvItem, PasoRoadmap, ScoringDimension } from './types';

export const empresas: Record<string, Empresa> = {
  globant: { id: 'globant', nombre: 'Globant', rubro: 'IT Services', tamaño: 'multinacional', pais: 'Argentina', logo: 'G', color: 'oklch(0.55 0.18 145)', glassdoor: 4.0 },
  ml: { id: 'ml', nombre: 'Mercado Libre', rubro: 'E-commerce', tamaño: 'multinacional', pais: 'Argentina', logo: 'M', color: 'oklch(0.78 0.18 90)', glassdoor: 4.2 },
  despegar: { id: 'despegar', nombre: 'Despegar', rubro: 'Travel Tech', tamaño: 'enterprise', pais: 'Argentina', logo: 'D', color: 'oklch(0.62 0.20 30)', glassdoor: 3.8 },
  microsoft: { id: 'microsoft', nombre: 'Microsoft', rubro: 'Cloud / SaaS', tamaño: 'multinacional', pais: 'EE.UU.', logo: 'MS', color: 'oklch(0.55 0.16 250)', glassdoor: 4.2 },
  aws: { id: 'aws', nombre: 'Amazon Web Services', rubro: 'Cloud Infrastructure', tamaño: 'multinacional', pais: 'EE.UU.', logo: 'AW', color: 'oklch(0.65 0.16 65)', glassdoor: 3.9 },
  datadog: { id: 'datadog', nombre: 'Datadog', rubro: 'Observability', tamaño: 'enterprise', pais: 'EE.UU.', logo: 'DD', color: 'oklch(0.55 0.22 290)', glassdoor: 4.1 },
  auth0: { id: 'auth0', nombre: 'Okta / Auth0', rubro: 'Identity SaaS', tamaño: 'enterprise', pais: 'EE.UU.', logo: 'A0', color: 'oklch(0.55 0.20 25)', glassdoor: 4.0 },
  ualá: { id: 'ualá', nombre: 'Uala', rubro: 'Fintech', tamaño: 'mediana', pais: 'Argentina', logo: 'U', color: 'oklch(0.62 0.20 285)', glassdoor: 4.0 },
  rappi: { id: 'rappi', nombre: 'Rappi', rubro: 'Delivery / Fintech', tamaño: 'enterprise', pais: 'Colombia', logo: 'R', color: 'oklch(0.65 0.21 25)', glassdoor: 3.5 },
  satellogic: { id: 'satellogic', nombre: 'Satellogic', rubro: 'Aerospace', tamaño: 'mediana', pais: 'Argentina', logo: 'S', color: 'oklch(0.45 0.10 250)', glassdoor: 3.9 },
  jpmorgan: { id: 'jpmorgan', nombre: 'JP Morgan BCC', rubro: 'Banca / Tech', tamaño: 'multinacional', pais: 'Argentina', logo: 'JP', color: 'oklch(0.40 0.10 250)', glassdoor: 3.9 },
  contxto: { id: 'contxto', nombre: 'Contxto', rubro: 'AI Infrastructure', tamaño: 'startup', pais: 'EE.UU.', logo: 'CX', color: 'oklch(0.50 0.18 320)', glassdoor: null },
};

export const pasosMicrosoft: PasoRoadmap[] = [
  { id: 'p1', titulo: 'Aplicación enviada', fecha: '2025-03-10', descripcion: 'CV enviado via LinkedIn. Versión 2.1 - Cloud Focus.', estado: 'completado', adjuntos: ['CV_2.1.pdf'] },
  { id: 'p2', titulo: 'Screening HR', fecha: '2025-03-18', descripcion: 'Llamada con recruiter Sarah M. 45 min. Discutimos expectativas salariales y fit cultural.', estado: 'completado' },
  { id: 'p3', titulo: 'Technical Screen', fecha: '2025-03-28', descripcion: 'Entrevista técnica con el equipo de Azure. DSA + System Design.', estado: 'completado', adjuntos: ['notas-prep.md'] },
  { id: 'p4', titulo: 'Loop Interview (x4)', fecha: '2025-04-10', descripcion: '4 entrevistas en un día. Behavioral, System Design, Coding, Team Fit.', estado: 'actual' },
  { id: 'p5', titulo: 'Oferta', fecha: null, descripcion: 'Esperar oferta formal del equipo de compensación.', estado: 'pendiente' },
  { id: 'p6', titulo: 'Negociación', fecha: null, descripcion: 'Negociar salario, equity y signing bonus.', estado: 'pendiente' },
  { id: 'p7', titulo: 'Cierre', fecha: null, descripcion: 'Firma de contrato y onboarding.', estado: 'pendiente' },
];

export const contactos: Record<string, Contacto> = {
  'sarah-m': { id: 'sarah-m', nombre: 'Sarah Mitchell', rol: 'Technical Recruiter', empresa: 'microsoft', email: 'sarah.m@microsoft.com', linkedin: 'linkedin.com/in/sarahmitchell', avatar: 'SM', color: 'oklch(0.55 0.16 250)' },
  'carlos-v': { id: 'carlos-v', nombre: 'Carlos Vega', rol: 'Engineering Manager', empresa: 'microsoft', email: 'carlos.v@microsoft.com', linkedin: 'linkedin.com/in/carlosvega', avatar: 'CV', color: 'oklch(0.52 0.20 250)' },
  'ana-r': { id: 'ana-r', nombre: 'Ana Rodríguez', rol: 'Senior Recruiter', empresa: 'globant', email: 'ana.r@globant.com', linkedin: 'linkedin.com/in/anarodriguez', avatar: 'AR', color: 'oklch(0.55 0.18 145)' },
  'pablo-g': { id: 'pablo-g', nombre: 'Pablo García', rol: 'Tech Lead', empresa: 'ml', email: 'pablo.g@mercadolibre.com', linkedin: 'linkedin.com/in/pablogarcia', avatar: 'PG', color: 'oklch(0.78 0.18 90)' },
  'lucia-f': { id: 'lucia-f', nombre: 'Lucia Fernández', rol: 'HR Business Partner', empresa: 'datadog', email: 'lucia.f@datadog.com', linkedin: 'linkedin.com/in/luciafernandez', avatar: 'LF', color: 'oklch(0.55 0.22 290)' },
  'martin-s': { id: 'martin-s', nombre: 'Martín Sosa', rol: 'CTO', empresa: 'contxto', email: 'martin@contxto.com', linkedin: 'linkedin.com/in/martinsosa', avatar: 'MS', color: 'oklch(0.50 0.18 320)' },
};

export const ofertas: Oferta[] = [
  {
    id: 'o1',
    titulo: 'Senior Software Engineer',
    empresa: 'microsoft',
    estado: 'en_proceso',
    tags: ['React', 'TypeScript', 'Azure', 'Node.js'],
    modalidad: 'remoto',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 9500,
    salarioNetoOfrecido: 7600,
    descripcionPuesto: 'Buscamos un Senior Software Engineer para unirse al equipo de Azure Developer Experience. Serás responsable de construir herramientas que millones de desarrolladores usan diariamente. El rol incluye diseño de sistemas distribuidos, mentoring del equipo y colaboración con PMs y Designers.',
    beneficios: ['Stock options', 'Health insurance', 'Remote first', '401k match', 'Learning budget $2000/año'],
    jornada: '40hs/semana',
    pais: 'EE.UU.',
    ciudad: 'Remote',
    contactos: ['sarah-m', 'carlos-v'],
    cvEnviado: 'CV_2.1_Cloud.pdf',
    pasoActual: 3,
    pasosTotales: 7,
    proximaFecha: '2025-04-10',
    scoring: 88,
    actualizadoEn: '2025-04-02',
    url: 'https://careers.microsoft.com',
    pretension: 10000,
  },
  {
    id: 'o2',
    titulo: 'Staff Engineer - Platform',
    empresa: 'ml',
    estado: 'aplicada',
    tags: ['Java', 'Kubernetes', 'Kafka', 'Go'],
    modalidad: 'hibrido',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 8000,
    salarioNetoOfrecido: 6400,
    descripcionPuesto: 'Staff Engineer para el equipo de Platform en Mercado Libre. Trabajarás en infraestructura que soporta millones de transacciones por día.',
    beneficios: ['Acciones', 'Seguro médico', 'Gym', 'Comedor'],
    jornada: '40hs/semana',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    contactos: ['pablo-g'],
    cvEnviado: 'CV_2.0.pdf',
    pasoActual: 1,
    pasosTotales: 5,
    proximaFecha: '2025-04-15',
    scoring: 72,
    actualizadoEn: '2025-03-28',
  },
  {
    id: 'o3',
    titulo: 'Principal Engineer',
    empresa: 'datadog',
    estado: 'en_proceso',
    tags: ['Go', 'Rust', 'eBPF', 'Distributed Systems'],
    modalidad: 'remoto',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 12000,
    salarioNetoOfrecido: 9600,
    descripcionPuesto: 'Principal Engineer en el equipo de Agent Infrastructure. Diseñarás la próxima generación del agente de observabilidad de Datadog.',
    beneficios: ['RSU', 'Remote', 'Health+Dental+Vision', 'Flexible PTO'],
    jornada: '40hs/semana',
    pais: 'EE.UU.',
    ciudad: 'Remote',
    contactos: ['lucia-f'],
    cvEnviado: 'CV_2.1_Cloud.pdf',
    pasoActual: 2,
    pasosTotales: 6,
    proximaFecha: '2025-04-20',
    scoring: 91,
    actualizadoEn: '2025-04-01',
  },
  {
    id: 'o4',
    titulo: 'Senior Frontend Engineer',
    empresa: 'globant',
    estado: 'nueva',
    tags: ['React', 'Next.js', 'TypeScript', 'Testing'],
    modalidad: 'remoto',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 5500,
    salarioNetoOfrecido: 4400,
    descripcionPuesto: 'Senior Frontend Engineer para trabajar con clientes de Fortune 500 en USA.',
    beneficios: ['Obra social', 'Capacitaciones', 'Días adicionales'],
    jornada: '40hs/semana',
    pais: 'Argentina',
    ciudad: 'Remote',
    contactos: ['ana-r'],
    cvEnviado: null,
    pasoActual: 0,
    pasosTotales: 4,
    proximaFecha: null,
    scoring: 65,
    actualizadoEn: '2025-04-03',
  },
  {
    id: 'o5',
    titulo: 'Engineering Manager',
    empresa: 'auth0',
    estado: 'oferta_recibida',
    tags: ['Leadership', 'Node.js', 'Identity', 'SaaS'],
    modalidad: 'remoto',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 11000,
    salarioNetoOfrecido: 8800,
    descripcionPuesto: 'Engineering Manager para liderar un equipo de 8 ingenieros en el producto de Auth0.',
    beneficios: ['Equity', 'Remote', 'Health coverage', 'Learning stipend'],
    jornada: '40hs/semana',
    pais: 'EE.UU.',
    ciudad: 'Remote',
    contactos: [],
    cvEnviado: 'CV_2.1_Cloud.pdf',
    pasoActual: 5,
    pasosTotales: 5,
    proximaFecha: '2025-04-08',
    scoring: 78,
    actualizadoEn: '2025-04-04',
  },
  {
    id: 'o6',
    titulo: 'Senior SRE',
    empresa: 'aws',
    estado: 'aplicada',
    tags: ['AWS', 'Terraform', 'Python', 'SRE'],
    modalidad: 'hibrido',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 10000,
    salarioNetoOfrecido: 8000,
    descripcionPuesto: 'Senior SRE para AWS infrastructure team.',
    beneficios: ['RSU', 'Sign-on bonus', 'Relocation'],
    jornada: '40hs/semana',
    pais: 'EE.UU.',
    ciudad: 'Seattle, WA',
    contactos: [],
    cvEnviado: 'CV_2.0.pdf',
    pasoActual: 1,
    pasosTotales: 6,
    proximaFecha: '2025-04-18',
    scoring: 70,
    actualizadoEn: '2025-03-30',
  },
  {
    id: 'o7',
    titulo: 'Tech Lead Frontend',
    empresa: 'ualá',
    estado: 'rechazada_empresa',
    tags: ['React Native', 'TypeScript', 'Fintech'],
    modalidad: 'hibrido',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 6000,
    salarioNetoOfrecido: 4800,
    descripcionPuesto: 'Tech Lead para el equipo de Mobile en Uala.',
    beneficios: ['Stock options', 'Comidas', 'Seguro'],
    jornada: '40hs/semana',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    contactos: [],
    cvEnviado: 'CV_2.0.pdf',
    pasoActual: 2,
    pasosTotales: 4,
    proximaFecha: null,
    scoring: 55,
    actualizadoEn: '2025-03-20',
  },
  {
    id: 'o8',
    titulo: 'Senior Backend Engineer',
    empresa: 'rappi',
    estado: 'ghosted',
    tags: ['Python', 'FastAPI', 'Postgres', 'Redis'],
    modalidad: 'remoto',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 5000,
    salarioNetoOfrecido: 4000,
    descripcionPuesto: 'Senior Backend Engineer para el equipo de Payments en Rappi.',
    beneficios: ['OSDE', 'Bonos'],
    jornada: '40hs/semana',
    pais: 'Colombia',
    ciudad: 'Remote',
    contactos: [],
    cvEnviado: 'CV_2.0.pdf',
    pasoActual: 1,
    pasosTotales: 5,
    proximaFecha: null,
    scoring: 42,
    actualizadoEn: '2025-03-10',
  },
  {
    id: 'o9',
    titulo: 'Staff Software Engineer',
    empresa: 'satellogic',
    estado: 'nueva',
    tags: ['Python', 'C++', 'Embedded', 'Space'],
    modalidad: 'presencial',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 7000,
    salarioNetoOfrecido: 5600,
    descripcionPuesto: 'Staff Engineer para el equipo de Software en tierra de Satellogic.',
    beneficios: ['Stock', 'Seguro', 'Comedor'],
    jornada: '40hs/semana',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    contactos: [],
    cvEnviado: null,
    pasoActual: 0,
    pasosTotales: 5,
    proximaFecha: null,
    scoring: 60,
    actualizadoEn: '2025-04-05',
  },
  {
    id: 'o10',
    titulo: 'Software Engineer II',
    empresa: 'jpmorgan',
    estado: 'en_proceso',
    tags: ['Java', 'Spring', 'Microservices', 'Finance'],
    modalidad: 'hibrido',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 6500,
    salarioNetoOfrecido: 5200,
    descripcionPuesto: 'Software Engineer II en el equipo de Core Banking en JP Morgan BCC Argentina.',
    beneficios: ['Obra social premium', 'Bonus anual', 'Días adicionales'],
    jornada: '40hs/semana',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    contactos: [],
    cvEnviado: 'CV_2.0.pdf',
    pasoActual: 2,
    pasosTotales: 5,
    proximaFecha: '2025-04-22',
    scoring: 68,
    actualizadoEn: '2025-03-25',
  },
  {
    id: 'o11',
    titulo: 'Senior ML Engineer',
    empresa: 'despegar',
    estado: 'aplicada',
    tags: ['Python', 'PyTorch', 'MLOps', 'Travel'],
    modalidad: 'hibrido',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 5800,
    salarioNetoOfrecido: 4640,
    descripcionPuesto: 'Senior ML Engineer para el equipo de Pricing & Recommendations de Despegar.',
    beneficios: ['Vouchers de viaje', 'Seguro', 'Flexibilidad'],
    jornada: '40hs/semana',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    contactos: [],
    cvEnviado: 'CV_2.0.pdf',
    pasoActual: 1,
    pasosTotales: 5,
    proximaFecha: '2025-04-25',
    scoring: 63,
    actualizadoEn: '2025-04-01',
  },
  {
    id: 'o12',
    titulo: 'AI Infrastructure Engineer',
    empresa: 'contxto',
    estado: 'nueva',
    tags: ['Python', 'LLMs', 'Infrastructure', 'AI'],
    modalidad: 'remoto',
    tipoEmpleo: 'full-time',
    metodoPago: 'mensual',
    moneda: 'USD',
    salarioBrutoOfrecido: 8500,
    salarioNetoOfrecido: 6800,
    descripcionPuesto: 'AI Infrastructure Engineer para construir la próxima generación de infraestructura para LLMs en Contxto.',
    beneficios: ['Equity', 'Remote', 'Async-first', 'Learning'],
    jornada: '40hs/semana',
    pais: 'EE.UU.',
    ciudad: 'Remote',
    contactos: ['martin-s'],
    cvEnviado: null,
    pasoActual: 0,
    pasosTotales: 4,
    proximaFecha: null,
    scoring: 82,
    actualizadoEn: '2025-04-06',
  },
];

export const perfilUsuario: PerfilUsuario = {
  nombre: 'Kevin',
  apellido: 'Aguilar',
  email: 'kevin.aguilar@email.com',
  telefono: '+54 11 1234-5678',
  linkedin: 'linkedin.com/in/kevinaguilar',
  rol: 'Senior Software Engineer',
  empresa: 'Freelance',
  senioridad: 'Senior',
  aniosExp: 7,
  pais: 'Argentina',
  ciudad: 'Buenos Aires',
  salarioBruto: 4500,
  salarioNeto: 3600,
  moneda: 'USD',
  modalidad: 'remoto',
  pretensionBruta: 9000,
  pretensionNeta: 7200,
  stack: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS', 'Next.js', 'GraphQL', 'Redis'],
  certificaciones: ['AWS Solutions Architect Associate', 'Google Cloud Professional', 'Scrum Master'],
};

export const activityLog: ActivityItem[] = [
  { id: 'a1', tipo: 'paso', texto: 'Completaste Technical Screen en Microsoft', ofertaId: 'o1', timestamp: '2025-04-02T14:30:00' },
  { id: 'a2', tipo: 'oferta', texto: 'Recibiste oferta de Okta / Auth0: $11.000/mes USD', ofertaId: 'o5', timestamp: '2025-04-01T10:00:00' },
  { id: 'a3', tipo: 'nueva', texto: 'Agregaste oferta en Contxto: AI Infrastructure Engineer', ofertaId: 'o12', timestamp: '2025-04-06T09:15:00' },
  { id: 'a4', tipo: 'rechazo', texto: 'Uala rechazó tu candidatura para Tech Lead Frontend', ofertaId: 'o7', timestamp: '2025-03-20T16:00:00' },
  { id: 'a5', tipo: 'nota', texto: 'Agregaste notas sobre la entrevista con Datadog', ofertaId: 'o3', timestamp: '2025-04-01T20:00:00' },
  { id: 'a6', tipo: 'cv', texto: 'Subiste CV_2.1_Cloud.pdf', timestamp: '2025-03-15T11:00:00' },
  { id: 'a7', tipo: 'scoring', texto: 'Actualizaste scoring de Datadog a 91/100', ofertaId: 'o3', timestamp: '2025-04-01T20:30:00' },
];

export const notas: NotaItem[] = [
  {
    id: 'n1',
    titulo: 'Notas - Entrevista Microsoft Loop',
    contenido: `# Loop Interview - Microsoft Azure
Fecha: 10 Abril 2025
Duración: ~4 horas

## Entrevistas

### 1. Behavioral (45 min)
- Preguntas STAR sobre liderazgo técnico
- Situación de conflicto con PM -> resolví priorizando datos
- Mayor impacto técnico -> migración monolito -> microservicios

### 2. System Design (60 min)
- Diseñar un sistema de notificaciones a escala (Twitter scale)
- Usé: Kafka + Redis Pub/Sub + WebSockets
- Buena recepción del diseño

### 3. Coding (45 min)
- Dos problemas: BFS en grafo + DP con memoización
- Completé ambos con tiempo

### 4. Team Fit (30 min)
- Preguntas sobre motivación y valores
- Por qué Microsoft -> cultura de growth mindset

## Sensación general
Muy positivo. El equipo fue amable y técnicamente exigente.
Espero respuesta en ~5 días hábiles.`,
    tags: ['microsoft', 'entrevista', 'loop'],
    ofertaId: 'o1',
    creadoEn: '2025-04-10',
    actualizadoEn: '2025-04-10',
  },
  {
    id: 'n2',
    titulo: 'Script de negociación salarial',
    contenido: `# Script Negociación

## Contexto
Tengo oferta de Auth0: $11.000 bruto USD/mes
Mi pretensión: $12.500 bruto USD/mes

## Argumentos

1. Market rate para EM con 7 años de exp: $11.5k-$14k (Levels.fyi)
2. Tengo oferta competidora (Datadog en proceso)
3. Aportaré experiencia inmediata en el stack

## Frases clave
"Estoy muy entusiasmado con esta oportunidad, y para poder tomar esta decisión necesito que la compensación refleje..."

## BATNA
Si no llegan a $12.000 -> pedir signing bonus de $10.000

## Deadline
Tengo hasta el 12/04 para dar respuesta`,
    tags: ['negociación', 'salario', 'estrategia'],
    creadoEn: '2025-04-04',
    actualizadoEn: '2025-04-05',
  },
  {
    id: 'n3',
    titulo: 'Prep técnica - System Design',
    contenido: `# System Design - Patrones frecuentes

## URL Shortener
- Hash MD5 -> 7 chars -> 3.5T combinaciones
- Cache LRU en Redis
- DB: PostgreSQL con índice en hash

## Rate Limiter
- Token bucket vs Leaky bucket
- Redis INCR + EXPIRE

## Notification System
- Kafka topics por tipo
- Push: APNs/FCM
- Email: SES + retry queue

## Recursos
- Designing Data-Intensive Applications ✓
- System Design Interview (Alex Xu) - Cap 1-10 ✓`,
    tags: ['técnico', 'prep', 'system-design'],
    creadoEn: '2025-03-25',
    actualizadoEn: '2025-04-01',
  },
];

export const cvs: CvItem[] = [
  { id: 'cv1', nombre: 'CV_2.1_Cloud.pdf', descripcion: 'Versión enfocada en Cloud y DevOps', version: 'v2.1', tamano: '245 KB', fecha: '15 Mar 2025', ofertasUsadas: 4, color: 'oklch(0.55 0.16 250)' },
  { id: 'cv2', nombre: 'CV_2.0.pdf', descripcion: 'Versión general generalista', version: 'v2.0', tamano: '238 KB', fecha: '01 Feb 2025', ofertasUsadas: 6, color: 'oklch(0.55 0.18 145)' },
  { id: 'cv3', nombre: 'CV_Frontend.pdf', descripcion: 'Versión especializada en Frontend', version: 'v1.8', tamano: '220 KB', fecha: '10 Ene 2025', ofertasUsadas: 2, color: 'oklch(0.62 0.20 30)' },
];

export const scoringDimensions: ScoringDimension[] = [
  { key: 'salario', label: 'Compensación', value: 4 },
  { key: 'tecnologia', label: 'Stack técnico', value: 5 },
  { key: 'cultura', label: 'Cultura empresa', value: 4 },
  { key: 'crecimiento', label: 'Crecimiento', value: 5 },
  { key: 'wlb', label: 'Work-life balance', value: 3 },
  { key: 'impacto', label: 'Impacto del rol', value: 4 },
  { key: 'equipo', label: 'Calidad del equipo', value: 5 },
  { key: 'estabilidad', label: 'Estabilidad', value: 4 },
];

export const kanbanCols = ['nueva', 'aplicada', 'en_proceso', 'oferta_recibida', 'rechazada_empresa', 'ghosted'] as const;

export const estadoLabels: Record<string, string> = {
  nueva: 'Nueva',
  aplicada: 'Aplicada',
  en_proceso: 'En proceso',
  oferta_recibida: 'Oferta recibida',
  rechazada_empresa: 'Rechazada',
  ghosted: 'Ghosted',
};

export const estadoColors: Record<string, string> = {
  nueva: 'oklch(0.55 0.012 250)',
  aplicada: 'oklch(0.52 0.20 250)',
  en_proceso: 'oklch(0.74 0.16 70)',
  oferta_recibida: 'oklch(0.70 0.19 155)',
  rechazada_empresa: 'oklch(0.58 0.22 25)',
  ghosted: 'oklch(0.55 0.012 250)',
};

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function getDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

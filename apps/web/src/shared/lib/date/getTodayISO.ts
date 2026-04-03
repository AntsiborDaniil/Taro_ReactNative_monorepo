export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

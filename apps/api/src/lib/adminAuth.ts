export const ADMIN_ROLES = ['admin', 'supervisor'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === 'admin' || role === 'supervisor';
}

export function isSupervisorRole(role: string | null | undefined): boolean {
  return role === 'supervisor';
}

export function parseRaListQuery(query: Record<string, unknown>): {
  start: number;
  end: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filter: Record<string, unknown>;
} {
  let start = 0;
  let end = 24;

  if (typeof query.range === 'string') {
    try {
      const parsed = JSON.parse(query.range) as unknown;
      if (
        Array.isArray(parsed) &&
        typeof parsed[0] === 'number' &&
        typeof parsed[1] === 'number'
      ) {
        start = Math.max(0, Math.floor(parsed[0]));
        end = Math.max(start, Math.floor(parsed[1]));
      }
    } catch {
      // keep defaults
    }
  }

  if (end - start > 99) {
    end = start + 99;
  }

  let sortField = 'created_at';
  let sortOrder: 'asc' | 'desc' = 'desc';
  if (typeof query.sort === 'string') {
    try {
      const parsed = JSON.parse(query.sort) as unknown;
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        sortField = parsed[0];
        sortOrder = String(parsed[1]).toUpperCase() === 'ASC' ? 'asc' : 'desc';
      }
    } catch {
      // keep defaults
    }
  }

  let filter: Record<string, unknown> = {};
  if (typeof query.filter === 'string') {
    try {
      const parsed = JSON.parse(query.filter) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        filter = parsed as Record<string, unknown>;
      }
    } catch {
      filter = {};
    }
  }

  return { start, end, sortField, sortOrder, filter };
}

export function filterString(filter: Record<string, unknown>, key: string): string {
  const value = filter[key];
  return typeof value === 'string' ? value.trim() : '';
}

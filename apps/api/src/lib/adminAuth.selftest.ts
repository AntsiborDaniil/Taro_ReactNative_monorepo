import { isAdminRole, isSupervisorRole, parseRaListQuery } from './adminAuth';

function assert(cond: unknown, message: string): void {
  if (!cond) {
    throw new Error(message);
  }
}

function run(): void {
  assert(isAdminRole('admin'), 'admin is admin');
  assert(isAdminRole('supervisor'), 'supervisor is admin');
  assert(!isAdminRole('user'), 'user is not admin');
  assert(isSupervisorRole('supervisor'), 'supervisor flag');
  assert(!isSupervisorRole('admin'), 'admin is not supervisor');

  const parsed = parseRaListQuery({
    range: '[0,24]',
    sort: '["email","ASC"]',
    filter: '{"q":"anna","role":"user"}',
  });
  assert(parsed.start === 0 && parsed.end === 24, 'range');
  assert(parsed.sortField === 'email' && parsed.sortOrder === 'asc', 'sort');
  assert(parsed.filter.q === 'anna' && parsed.filter.role === 'user', 'filter');

  console.log('adminAuth self-test ok');
}

if (require.main === module) {
  run();
}
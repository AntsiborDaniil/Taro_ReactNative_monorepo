function isTelegramMiniAppClient(ua, initData) {
  if (initData) {
    return true;
  }
  return /\bTelegram\b/i.test(ua);
}

function isAdminRole(role) {
  return role === 'admin' || role === 'supervisor';
}

function isSupervisorRole(role) {
  return role === 'supervisor';
}

function parseRaListQuery(query) {
  let start = 0;
  let end = 24;

  if (typeof query.range === 'string') {
    try {
      const parsed = JSON.parse(query.range);
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
  let sortOrder = 'desc';
  if (typeof query.sort === 'string') {
    try {
      const parsed = JSON.parse(query.sort);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        sortField = parsed[0];
        sortOrder = String(parsed[1]).toUpperCase() === 'ASC' ? 'asc' : 'desc';
      }
    } catch {
      // keep defaults
    }
  }

  let filter = {};
  if (typeof query.filter === 'string') {
    try {
      const parsed = JSON.parse(query.filter);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        filter = parsed;
      }
    } catch {
      filter = {};
    }
  }

  return { start, end, sortField, sortOrder, filter };
}

function assert(cond, message) {
  if (!cond) {
    throw new Error(message);
  }
}

assert(isTelegramMiniAppClient('Mozilla', 'query_id=1'), 'initData blocks');
assert(isTelegramMiniAppClient('Telegram Android'), 'UA Telegram blocks');
assert(!isTelegramMiniAppClient('Mozilla/5.0 Chrome/120'), 'chrome allowed');
assert(isAdminRole('supervisor'), 'supervisor is admin');
assert(isAdminRole('admin'), 'admin is admin');
assert(!isAdminRole('user'), 'user is not admin');
assert(isSupervisorRole('supervisor'), 'supervisor flag');
assert(!isSupervisorRole('admin'), 'admin is not supervisor');

const parsed = parseRaListQuery({
  range: '[10,20]',
  sort: '["id","DESC"]',
  filter: '{"q":"anna","role":"user"}',
});
assert(parsed.start === 10 && parsed.end === 20, 'range parse');
assert(parsed.sortField === 'id' && parsed.sortOrder === 'desc', 'sort');
assert(parsed.filter.q === 'anna' && parsed.filter.role === 'user', 'filter');

console.log('verify-admin ok');

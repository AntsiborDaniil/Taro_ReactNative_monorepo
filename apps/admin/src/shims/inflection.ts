/** ESM inflection used by react-admin. Vendored API, no broken pnpm package. */

function underscore(str: string): string {
  return String(str)
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function camelize(str: string, lowFirstLetter?: boolean): string {
  const s = String(str).replace(/[_\s-]+(.)?/g, (_, c: string | undefined) =>
    c ? c.toUpperCase() : ''
  );
  if (!s) {
    return s;
  }
  return lowFirstLetter
    ? s.charAt(0).toLowerCase() + s.slice(1)
    : s.charAt(0).toUpperCase() + s.slice(1);
}

function humanize(str: string): string {
  const s = underscore(str).replace(/_id$/, '').replace(/_/g, ' ').trim();
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function capitalize(str: string): string {
  const s = String(str);
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function titleize(str: string): string {
  return humanize(str).replace(/\b\w/g, (m) => m.toUpperCase());
}

function pluralize(str: string): string {
  const s = String(str);
  if (/[^aeiou]y$/i.test(s)) {
    return `${s.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/i.test(s)) {
    return `${s}es`;
  }
  if (s.endsWith('s')) {
    return s;
  }
  return `${s}s`;
}

function singularize(str: string): string {
  const s = String(str);
  if (/ies$/i.test(s)) {
    return `${s.slice(0, -3)}y`;
  }
  if (/(ses|xes|zes|ches|shes)$/i.test(s)) {
    return s.slice(0, -2);
  }
  if (s.endsWith('s') && !s.endsWith('ss')) {
    return s.slice(0, -1);
  }
  return s;
}

function dasherize(str: string): string {
  return underscore(str).replace(/_/g, '-');
}

function inflect(str: string, count?: number): string {
  return count === 1 ? singularize(str) : pluralize(str);
}

function demodulize(str: string): string {
  return String(str).replace(/.*[\\/]/, '');
}

function tableize(str: string): string {
  return pluralize(underscore(str));
}

function classify(str: string): string {
  return camelize(singularize(str));
}

function foreignKey(str: string): string {
  return `${underscore(singularize(str))}_id`;
}

function ordinalize(str: string): string {
  const n = String(str);
  const num = Number.parseInt(n, 10);
  if (!Number.isFinite(num)) {
    return n;
  }
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${n}th`;
  }
  switch (num % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

const TRANSFORMERS: Record<string, (value: string) => string> = {
  underscore,
  camelize,
  humanize,
  capitalize,
  titleize,
  pluralize,
  singularize,
  dasherize,
  inflect,
  demodulize,
  tableize,
  classify,
  foreignKey,
  ordinalize,
};

function transform(str: string, arr: string[] = []): string {
  return arr.reduce((acc, name) => {
    const fn = TRANSFORMERS[name];
    return fn ? fn(acc) : acc;
  }, String(str));
}

const inflection = {
  underscore,
  camelize,
  humanize,
  capitalize,
  titleize,
  pluralize,
  singularize,
  dasherize,
  inflect,
  demodulize,
  tableize,
  classify,
  foreignKey,
  ordinalize,
  transform,
};

export default inflection;
export {
  camelize,
  capitalize,
  classify,
  dasherize,
  demodulize,
  foreignKey,
  humanize,
  inflect,
  ordinalize,
  pluralize,
  singularize,
  tableize,
  titleize,
  transform,
  underscore,
};

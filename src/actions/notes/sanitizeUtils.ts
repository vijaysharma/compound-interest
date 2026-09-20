export function sanitizeServerContent(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  if (raw.startsWith('e2e:v1:')) {
    return raw.length > 10_000_000 ? raw.slice(0, 10_000_000) : raw;
  }
  const content = raw.length > 5_000_000 ? raw.slice(0, 5_000_000) : raw;
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*['"]?(?:javascript|data|vbscript):[^'">\s]*/gi, 'href="#"');
}
export function sanitizeServerTitle(input: unknown): string {
  if (typeof input !== 'string') return '';
  if (input.startsWith('e2e:v1:')) {
    return input.slice(0, 4000);
  }
  return input
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 250);
}
export function sanitizeServerPlain(input: unknown, maxLen = 250): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLen);
}
export function sanitizeServerId(id: unknown): string {
  if (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id.trim())) {
    return id.trim();
  }
  return crypto.randomUUID();
}
export function parseTags(raw: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      return [];
    }
  }
  return list
    .filter((t): t is string => typeof t === 'string')
    .map((t) => (t as string).replace(/[^\w-]/g, '').slice(0, 50).toLowerCase())
    .filter(Boolean)
    .slice(0, 30);
}

export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function safeNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

export function safeBoolean(value: unknown): boolean {
  if (value === 'true' || value === 'yes' || value === true) return true;
  return false;
}

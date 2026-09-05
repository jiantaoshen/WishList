export function parseRequiredPositiveNumber(value: string, label: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }

  return parsed;
}


export function parseOptionalPositiveNumber(value: string, label: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  return parseRequiredPositiveNumber(trimmed, label);
}


export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  }
  catch {
    return false;
  }
}
export function formatPrice(value: number, maximumDecimals = 2): string {
  return value.toLocaleString("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maximumDecimals,
  });
}


export function formatMoney(
  value: number | null,
  currency: string,
): string {
  if (value === null) return "—";

  return `${formatPrice(value)} ${currency}`;
}


export function formatUnitPrice(
  value: number | null,
  currency: string,
  unit: string | null,
): string {
  if (value === null) return "—";

  return `${formatPrice(value, 4)} ${currency}${unit ? `/${unit}` : ""}`;
}


export function formatQuantity(value: number): string {
  return value.toLocaleString("sv-SE", {
    maximumFractionDigits: 4,
  });
}


export function numbersEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.0001;
}
export type InvoiceLine = { name: string; description: string; quantity: string; unitPrice: string };
export const emptyLine = (): InvoiceLine => ({ name: '', description: '', quantity: '1', unitPrice: '' });

function decimalUnits(value: string, wholeDigits: number): bigint | null {
  const match = value.match(new RegExp(`^(\\d{1,${wholeDigits}})(?:[.,](\\d{1,2}))?$`));
  if (!match) return null;
  return BigInt(match[1]) * BigInt(100) + BigInt((match[2] || '').padEnd(2, '0'));
}
export function lineTotal(line: InvoiceLine): number | null {
  const quantity = decimalUnits(line.quantity, 6);
  const price = decimalUnits(line.unitPrice, 9);
  if (quantity === null || quantity === BigInt(0) || price === null) return null;
  const total = (quantity * price + BigInt(50)) / BigInt(100);
  return total <= BigInt(99999999999) ? Number(total) : null;
}
export function linesTotal(lines: InvoiceLine[]): number | null {
  if (!lines.length || lines.length > 30) return null;
  let total = 0;
  for (const line of lines) {
    const amount = lineTotal(line);
    if (!line.name.trim() || line.name.length > 120 || line.description.length > 500 || amount === null) return null;
    total += amount;
    if (total > 99999999999) return null;
  }
  return total;
}
export function parseLines(raw: string): InvoiceLine[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 30) return null;
    const lines: InvoiceLine[] = [];
    for (const value of parsed) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const line = value as Record<string, unknown>;
      if (typeof line.name !== 'string' || typeof line.description !== 'string' || typeof line.quantity !== 'string' || typeof line.unitPrice !== 'string') return null;
      if (line.name.length > 120 || line.description.length > 500 || line.quantity.length > 9 || line.unitPrice.length > 12) return null;
      lines.push({ name: line.name, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice });
    }
    return lines;
  } catch { return null; }
}
export function linesForDraft(data: Record<string, string>): InvoiceLine[] {
  return (data.items && parseLines(data.items)) || (data.name || data.amount ? [{ name: data.name || '', description: '', quantity: '1', unitPrice: data.amount || '' }] : [emptyLine()]);
}
export function formatCents(cents: number): string { return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`; }
export function displayCents(cents: number | null, language: 'fr' | 'en' = 'fr'): string { return cents === null ? (language === 'en' ? 'Pending calculation' : 'À calculer') : new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100); }

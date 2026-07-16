/**
 * Formats a number to Indonesian Rupiah representation
 * Example: 22000 => Rp22.000
 */
export function formatCurrency(value: number): string {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return `Rp${formatter.format(value)}`;
}

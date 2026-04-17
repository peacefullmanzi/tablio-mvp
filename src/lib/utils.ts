/**
 * Formats a number into a Rwandan Franc (RWF) currency string.
 * Example: 5000 -> "5,000 RWF"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' RWF';
}

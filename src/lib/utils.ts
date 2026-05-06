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

/**
 * Formats a date into "DD MMM YYYY, HH:mm"
 * Example: 12 May 2026, 14:32
 */
export function formatDate(date: Date | string | number | unknown): string {
  if (!date) return '—';
  
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as any).toDate === 'function') {
    d = (date as any).toDate();
  } else {
    d = new Date(date as any);
  }

  if (isNaN(d.getTime())) return '—';

  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

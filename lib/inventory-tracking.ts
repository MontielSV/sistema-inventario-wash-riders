import { randomUUID } from 'node:crypto';

export function createInventoryTrackingCode() {
  const dateParts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const date = ['year', 'month', 'day']
    .map((type) => dateParts.find((part) => part.type === type)?.value || '')
    .join('');
  return `WR-${date}-${randomUUID().slice(0, 12).toUpperCase()}`;
}

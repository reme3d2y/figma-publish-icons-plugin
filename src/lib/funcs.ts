export function chunk(arr: any[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

export function formatLastSyncDate(ds: string): string {
  const twoDigit = (num: number) => num.toString().padStart(2, '0');
  const d = new Date(ds);
  const day = twoDigit(d.getDate());
  const month = twoDigit(d.getMonth());
  const year = d.getFullYear();
  const hours = twoDigit(d.getHours());
  const minutes = twoDigit(d.getMinutes());
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

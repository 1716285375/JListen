export const toMs = (seconds: number) => Math.round(seconds * 1000);
export const toSeconds = (ms: number) => ms / 1000;
export function formatTime(ms: number, precise = false) {
  const value = Math.max(0, Math.round(ms));
  return `${String(Math.floor(value / 60000)).padStart(2, '0')}:${String(Math.floor(value / 1000) % 60).padStart(2, '0')}${precise ? `.${String(Math.floor(value % 1000 / 10)).padStart(2, '0')}` : ''}`;
}

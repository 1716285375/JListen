export function assetUrl(path: string, base = import.meta.env?.BASE_URL ?? '/'): string {
  const relative = path.replace(/^\/+/, '');
  if (!relative || /(^|\/)\.\.(\/|$)|[\\:]|^\//.test(relative)) throw new Error('无效资源路径');
  return `${base.replace(/\/?$/, '/')}${relative}`;
}

export function audioUrl(path: string, remoteBase = import.meta.env?.VITE_AUDIO_BASE_URL ?? ''): string {
  if (!remoteBase) return assetUrl(path);
  const base = new URL(remoteBase);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('音频地址必须是无凭据的 HTTPS 地址');
  return assetUrl(path, base.href);
}

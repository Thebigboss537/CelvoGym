const PARAMS = 'autoplay=1&rel=0';

export function youtubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const shortMatch = url.match(/^https?:\/\/youtu\.be\/([\w-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?${PARAMS}`;
  const watchMatch = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?${PARAMS}`;
  const embedMatch = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/embed\/([\w-]+)/);
  if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}?${PARAMS}`;
  const shortsMatch = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([\w-]+)/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?${PARAMS}`;
  return null;
}

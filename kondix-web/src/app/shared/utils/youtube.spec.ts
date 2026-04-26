import { describe, expect, it } from 'vitest';
import { youtubeEmbedUrl } from './youtube';

describe('youtubeEmbedUrl', () => {
  it('normalizes youtu.be short links', () => {
    expect(youtubeEmbedUrl('https://youtu.be/abc123')).toBe(
      'https://www.youtube.com/embed/abc123?autoplay=1&rel=0',
    );
  });
  it('normalizes youtube.com/watch links', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=xyz789')).toBe(
      'https://www.youtube.com/embed/xyz789?autoplay=1&rel=0',
    );
  });
  it('passes through already-embed URLs unchanged', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/foo')).toBe(
      'https://www.youtube.com/embed/foo?autoplay=1&rel=0',
    );
  });
  it('returns null for non-YouTube URLs', () => {
    expect(youtubeEmbedUrl('https://vimeo.com/123')).toBeNull();
  });
  it('returns null for null/empty input', () => {
    expect(youtubeEmbedUrl(null)).toBeNull();
    expect(youtubeEmbedUrl('')).toBeNull();
  });
});

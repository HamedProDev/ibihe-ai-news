import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  durationLabel,
  isIframeEmbeddable,
  isSafeEmbedUrl,
  isSafeFileUrl,
  normalizeVideos,
  parseVideoUrl,
} from '../../src/lib/media/video.ts';

describe('video url parsing (newsroom embeds)', () => {
  it('normalizes every YouTube shape to a nocookie embed', () => {
    for (const raw of [
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    ]) {
      const p = parseVideoUrl(raw);
      assert.ok(p, raw);
      assert.equal(p!.provider, 'youtube');
      assert.equal(p!.videoId, 'dQw4w9WgXcQ');
      assert.match(p!.embedUrl, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?rel=0/);
      assert.match(p!.thumbnailUrl ?? '', /ytimg\.com\/vi\/dQw4w9WgXcQ/);
    }
  });

  it('keeps the playlist and start time', () => {
    const p = parseVideoUrl('https://www.youtube.com/watch?v=abc12345678&list=PL999&t=90');
    assert.equal(p?.playlistId, 'PL999');
    assert.equal(p?.startSec, 90);
    assert.match(p!.embedUrl, /start=90/);
  });

  it('parses vimeo and dailymotion', () => {
    assert.equal(parseVideoUrl('https://vimeo.com/76979871')?.embedUrl, 'https://player.vimeo.com/video/76979871');
    assert.equal(parseVideoUrl('https://player.vimeo.com/video/76979871')?.videoId, '76979871');
    assert.equal(parseVideoUrl('https://www.dailymotion.com/video/x8zzzz')?.provider, 'dailymotion');
  });

  it('treats facebook and X as link-out (never iframed blindly)', () => {
    const fb = parseVideoUrl('https://www.facebook.com/Ibihe/videos/1234567890/');
    assert.equal(fb?.provider, 'facebook');
    assert.equal(fb?.embeddable, true);
    const x = parseVideoUrl('https://x.com/user/status/1234567890123');
    assert.equal(x?.provider, 'x');
    assert.equal(x?.embeddable, false);
    assert.equal(isIframeEmbeddable({ provider: 'x', embedUrl: 'https://x.com/a' }), false);
  });

  it('accepts https media files and hls, rejects the rest', () => {
    assert.equal(parseVideoUrl('https://cdn.ibihe.rw/v/clip.mp4')?.provider, 'file');
    assert.equal(parseVideoUrl('https://cdn.ibihe.rw/live/master.m3u8')?.provider, 'hls');
    assert.equal(parseVideoUrl('https://evil.example.com/player'), null);
    assert.equal(parseVideoUrl('javascript:alert(1)'), null);
    assert.equal(parseVideoUrl(''), null);
  });

  it('embed + file safety checks are used again at render time', () => {
    assert.equal(isSafeEmbedUrl('https://www.youtube-nocookie.com/embed/abc'), true);
    assert.equal(isSafeEmbedUrl('https://evil.example.com/embed'), false);
    assert.equal(isSafeEmbedUrl('/local/path'), false);
    assert.equal(isSafeFileUrl('https://cdn.rw/a.mp4'), true);
    assert.equal(isSafeFileUrl('http://cdn.rw/a.mp4'), false);
    assert.equal(isSafeFileUrl('https://cdn.rw/a.exe'), false);
  });

  it('drops unknown providers and rebuilds embeds on save', () => {
    const out = normalizeVideos([
      { url: 'https://youtu.be/abc123DEF45', caption: 'Report', placement: 'hero' },
      { url: 'https://evil.example.com/x' },
      { url: 'garbage' },
      { embedUrl: 'https://player.vimeo.com/video/76979871' },
      null,
      'string',
    ]);
    assert.equal(out.length, 2);
    assert.equal(out[0].provider, 'youtube');
    assert.equal(out[0].placement, 'hero');
    assert.equal(out[0].embedUrl, 'https://www.youtube-nocookie.com/embed/abc123DEF45?rel=0');
    assert.match(out[0].thumbnailUrl ?? '', /ytimg/);
    assert.equal(out[1].provider, 'vimeo');
    // ids are generated and unique enough for body tokens
    assert.notEqual(out[0].id, out[1].id);
  });

  it('caps the list and clamps odd numbers', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ url: `https://youtu.be/vid${i}aaaa`, durationSec: -5 }));
    const out = normalizeVideos(many);
    assert.equal(out.length, 12);
    assert.equal(out[0].durationSec, undefined);
  });

  it('formats durations for the player caption', () => {
    assert.equal(durationLabel(59), '0:59');
    assert.equal(durationLabel(600), '10:00');
    assert.equal(durationLabel(3725), '1:02:05');
    assert.equal(durationLabel(0), '');
  });
});

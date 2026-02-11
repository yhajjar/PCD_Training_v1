import { describe, expect, it } from 'vitest';
import { resolvePocketBaseBaseUrl, sanitizePocketBaseApiUrl } from './clientConfig';

const locationLike = { origin: 'https://training-hub.ku.ac.ae' };

describe('resolvePocketBaseBaseUrl', () => {
  it('uses window origin fallback when env value is empty', () => {
    expect(resolvePocketBaseBaseUrl('', locationLike)).toBe('https://training-hub.ku.ac.ae');
  });

  it('keeps absolute env URLs while trimming trailing slashes', () => {
    expect(resolvePocketBaseBaseUrl('https://training-hub.ku.ac.ae/', locationLike)).toBe(
      'https://training-hub.ku.ac.ae'
    );
  });

  it('normalizes relative env URLs against origin safely', () => {
    expect(resolvePocketBaseBaseUrl('/api', locationLike)).toBe('https://training-hub.ku.ac.ae');
  });
});

describe('sanitizePocketBaseApiUrl', () => {
  it('rewrites /admin/api/... URLs to root /api/...', () => {
    const result = sanitizePocketBaseApiUrl(
      'https://training-hub.ku.ac.ae/admin/api/collections/categories/records?page=1',
      locationLike
    );

    expect(result.rewritten).toBe(true);
    expect(new URL(result.url).pathname).toBe('/api/collections/categories/records');
    expect(new URL(result.url).search).toBe('?page=1');
  });

  it('rewrites deeply nested route-relative API URLs', () => {
    const result = sanitizePocketBaseApiUrl(
      'https://training-hub.ku.ac.ae/admin/training/new/api/collections/trainings/records',
      locationLike
    );

    expect(result.rewritten).toBe(true);
    expect(new URL(result.url).pathname).toBe('/api/collections/trainings/records');
  });

  it('keeps already-correct /api URLs unchanged', () => {
    const result = sanitizePocketBaseApiUrl(
      'https://training-hub.ku.ac.ae/api/collections/trainings/records?page=1',
      locationLike
    );

    expect(result.rewritten).toBe(false);
    expect(result.url).toBe('https://training-hub.ku.ac.ae/api/collections/trainings/records?page=1');
  });
});

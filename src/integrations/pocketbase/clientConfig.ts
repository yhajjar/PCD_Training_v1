interface LocationLike {
  origin: string;
}

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const TRAILING_SLASH_REGEX = /\/+$/;

function trimTrailingSlashes(value: string): string {
  return value.replace(TRAILING_SLASH_REGEX, '');
}

function resolveRuntimeLocation(locationLike?: LocationLike): LocationLike | undefined {
  if (locationLike) return locationLike;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return { origin: window.location.origin };
  }
  return undefined;
}

function stripApiSuffix(url: URL): URL {
  if (url.pathname === '/api' || url.pathname === '/api/') {
    url.pathname = '/';
  }
  return url;
}

export function resolvePocketBaseBaseUrl(rawValue?: string, locationLike?: LocationLike): string {
  const runtimeLocation = resolveRuntimeLocation(locationLike);
  const normalized = (rawValue ?? '').trim();

  if (ABSOLUTE_URL_REGEX.test(normalized)) {
    return trimTrailingSlashes(normalized);
  }

  if (normalized && runtimeLocation?.origin) {
    const resolved = stripApiSuffix(new URL(normalized, `${trimTrailingSlashes(runtimeLocation.origin)}/`));
    return trimTrailingSlashes(resolved.toString());
  }

  if (normalized) {
    return normalized;
  }

  if (runtimeLocation?.origin) {
    return trimTrailingSlashes(runtimeLocation.origin);
  }

  return '/';
}

export function sanitizePocketBaseApiUrl(url: string, locationLike?: LocationLike): { url: string; rewritten: boolean } {
  const runtimeLocation = resolveRuntimeLocation(locationLike);
  const fallbackOrigin = runtimeLocation?.origin ?? 'http://127.0.0.1';

  let parsed: URL;
  try {
    parsed = new URL(url, fallbackOrigin);
  } catch {
    return { url, rewritten: false };
  }

  const apiSegment = /\/api(?:\/|$)/.exec(parsed.pathname);
  if (!apiSegment || apiSegment.index === 0) {
    return { url: parsed.toString(), rewritten: false };
  }

  parsed.pathname = parsed.pathname.slice(apiSegment.index);
  return { url: parsed.toString(), rewritten: true };
}

import PocketBase from 'pocketbase';
import { resolvePocketBaseBaseUrl, sanitizePocketBaseApiUrl } from './clientConfig';

// Import the PocketBase client like this:
// import { pb } from "@/integrations/pocketbase/client";

// Always resolve to an absolute origin to avoid route-relative API calls on nested SPA paths.
const POCKETBASE_URL = resolvePocketBaseBaseUrl(import.meta.env.VITE_POCKETBASE_URL);

export const pb = new PocketBase(POCKETBASE_URL);

let hasWarnedUrlRewrite = false;
pb.beforeSend = (url, options) => {
  const sanitized = sanitizePocketBaseApiUrl(url);
  if (!sanitized.rewritten) {
    return { url, options };
  }

  if (!hasWarnedUrlRewrite) {
    console.warn(
      '[PocketBase] Rewrote route-relative API URL to root /api path. Check VITE_POCKETBASE_URL/base URL config.',
      { from: url, to: sanitized.url }
    );
    hasWarnedUrlRewrite = true;
  }

  return { url: sanitized.url, options };
};

// Auto-refresh auth on page load
pb.autoCancellation(false);

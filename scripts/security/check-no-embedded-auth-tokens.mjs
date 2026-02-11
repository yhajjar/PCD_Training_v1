#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

if (!fs.existsSync(ASSETS_DIR)) {
  console.error(`Build output not found: ${ASSETS_DIR}`);
  process.exit(1);
}

const jwtRegex = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const riskyMatches = [];

function decodePayload(jwt) {
  const [, payload] = jwt.split('.');
  if (!payload) return null;
  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

for (const file of fs.readdirSync(ASSETS_DIR)) {
  if (!file.endsWith('.js')) continue;

  const filePath = path.join(ASSETS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(jwtRegex) || [];

  for (const token of matches) {
    const payload = decodePayload(token);
    if (!payload) continue;

    const isAuthToken =
      payload?.type === 'auth' &&
      typeof payload?.collectionId === 'string' &&
      typeof payload?.id === 'string';

    if (isAuthToken) {
      riskyMatches.push({
        file,
        tokenPreview: `${token.slice(0, 16)}...${token.slice(-8)}`,
        payload,
      });
    }
  }
}

if (riskyMatches.length > 0) {
  console.error('Security check failed: embedded PocketBase auth token(s) detected in built bundle.');
  for (const match of riskyMatches) {
    console.error(`- ${match.file}: ${match.tokenPreview}`);
    console.error(`  payload: ${JSON.stringify(match.payload)}`);
  }
  process.exit(1);
}

console.log('Security check passed: no embedded PocketBase auth tokens found in dist assets.');

#!/usr/bin/env node
import crypto from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_CANDIDATES = ['.env.local', '.env'];

const parseEnvFile = (content) => {
  const result = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  });

  return result;
};

const loadEnv = () => {
  const env = { ...process.env };

  ENV_CANDIDATES.forEach((fileName) => {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      return;
    }

    try {
      const fileEnv = parseEnvFile(readFileSync(filePath, 'utf8'));
      Object.entries(fileEnv).forEach(([key, value]) => {
        if (env[key] === undefined) {
          env[key] = value;
        }
      });
    } catch (error) {
      console.warn(`Failed to read ${fileName}:`, error.message);
    }
  });

  return env;
};

const env = loadEnv();

const cliArgs = new Map();
process.argv.slice(2).forEach((arg) => {
  const [key, value] = arg.split('=');
  if (key.startsWith('--') && value) {
    cliArgs.set(key.slice(2), value);
  }
});

const secret = env.VITE_AUTH_SECRET || env.AUTH_SECRET;

if (!secret) {
  console.error('Missing VITE_AUTH_SECRET or AUTH_SECRET. Please configure it in your environment file.');
  process.exit(1);
}

const ttlDaysFromEnv = env.TOKEN_TTL_DAYS ? Number(env.TOKEN_TTL_DAYS) : undefined;
const ttlOverride = cliArgs.has('days') ? Number(cliArgs.get('days')) : undefined;
const ttlDays = ttlOverride ?? ttlDaysFromEnv ?? 3;

if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
  console.error('Invalid token lifespan. Ensure TOKEN_TTL_DAYS is a positive number.');
  process.exit(1);
}

const issuedAt = Date.now();
const expiresAt = issuedAt + Math.round(ttlDays * 24 * 60 * 60 * 1000);
const nonce = crypto.randomBytes(16).toString('hex');
const payload = `${nonce}.${expiresAt}`;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
const token = `${payload}.${signature}`;

console.log('Token generated successfully!');
console.log(`Issued at: ${new Date(issuedAt).toISOString()}`);
console.log(`Expires at: ${new Date(expiresAt).toISOString()} (in ${ttlDays} day(s))`);
console.log('\nToken:');
console.log(token);

const textEncoder = new TextEncoder();

const base64UrlToUint8Array = (input: string): Uint8Array => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  const padded = normalized + '='.repeat(padding);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

let cachedSecret: string | null = null;
let cachedKey: CryptoKey | null = null;

const importSecretKey = async (secret: string): Promise<CryptoKey> => {
  if (cachedKey && cachedSecret === secret) {
    return cachedKey;
  }

  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable. Token verification cannot proceed.');
  }

  const key = await window.crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

  cachedSecret = secret;
  cachedKey = key;

  return key;
};

export interface TokenValidationResult {
  valid: boolean;
  expiresAt?: number;
  reason?: string;
}

export const validateToken = async (token: string): Promise<TokenValidationResult> => {
  const secret = import.meta.env.VITE_AUTH_SECRET as string | undefined;

  if (!secret) {
    return { valid: false, reason: 'Missing application secret.' };
  }

  const trimmed = token.trim();
  const segments = trimmed.split('.');

  if (segments.length !== 3) {
    return { valid: false, reason: 'Invalid token format.' };
  }

  const [nonce, expiresAtRaw, signatureRaw] = segments;
  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt)) {
    return { valid: false, reason: 'Invalid token expiration.' };
  }

  if (Date.now() > expiresAt) {
    return { valid: false, reason: 'Token has expired.' };
  }

  if (!nonce) {
    return { valid: false, reason: 'Invalid token payload.' };
  }

  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return { valid: false, reason: 'Token verification is unavailable in this environment.' };
  }

  try {
    const key = await importSecretKey(secret);
    const payload = `${nonce}.${expiresAt}`;
    const signature = base64UrlToUint8Array(signatureRaw);
    const payloadBytes = textEncoder.encode(payload);

    const isValid = await window.crypto.subtle.verify('HMAC', key, signature, payloadBytes);

    return isValid ? { valid: true, expiresAt } : { valid: false, reason: 'Token signature mismatch.' };
  } catch (error) {
    console.error('Failed to validate token', error);
    return { valid: false, reason: 'Token verification failed.' };
  }
};

export const AUTH_TOKEN_STORAGE_KEY = 'vendor-analysis-auth-token';

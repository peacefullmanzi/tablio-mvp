const REQUIRED_SERVER_ENV = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'JWT_SECRET',
];

export function validateEnvVars() {
  if (process.env.NEXT_PUBLIC_VERCEL === '1') {
    console.log('[EnvValidation] Running on Vercel - skipping validation');
    return [];
  }

  const missing: string[] = [];

  for (const key of REQUIRED_SERVER_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`[EnvValidation] Missing required environment variables:\n${missing.join('\n')}`);
  } else if (missing.length === 0) {
    console.log('[EnvValidation] All required environment variables are set');
  } else {
    console.warn('[EnvValidation] Running in development mode');
  }

  return missing;
}
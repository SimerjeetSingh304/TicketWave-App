import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_ENV = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL'
];

export function validateEnv() {
  const missing = [];
  for (const env of REQUIRED_ENV) {
    if (!process.env[env]) {
      missing.push(env);
    }
  }

  if (missing.length > 0) {
    console.error(`[ERROR] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Set defaults
  process.env.PORT = process.env.PORT || '5000';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
}

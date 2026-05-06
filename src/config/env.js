import dotenv from 'dotenv'

dotenv.config()

const requiredVars = ['DATABASE_URL']

for (const key of requiredVars) {
  if (!process.env[key]) {
    console.warn(`⚠️  Missing environment variable: ${key}`)
  }
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  admin: {
    username: process.env.ADMIN_USERNAME || 'Emiro',
    password: process.env.ADMIN_PASSWORD || 'EmiroAPP2026cc',
  },
  tokenTtlMs:
    Number(process.env.TOKEN_TTL_MS) || 1000 * 60 * 60 * 24, // 24h default
}

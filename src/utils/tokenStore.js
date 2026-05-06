import crypto from 'node:crypto'
import { env } from '../config/env.js'

// Simple in-memory session token store.
// For a single-instance backend this is enough; swap for Redis if scaled out.
const tokens = new Map()

export const createToken = (username) => {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + env.tokenTtlMs
  tokens.set(token, { username, expiresAt })
  return { token, expiresAt }
}

export const getSession = (token) => {
  if (!token) return null
  const session = tokens.get(token)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    tokens.delete(token)
    return null
  }
  return session
}

export const revokeToken = (token) => {
  if (!token) return false
  return tokens.delete(token)
}

// Periodically purge expired tokens to avoid memory growth.
const PURGE_INTERVAL_MS = 1000 * 60 * 15
const purgeTimer = setInterval(() => {
  const now = Date.now()
  for (const [token, session] of tokens) {
    if (session.expiresAt <= now) tokens.delete(token)
  }
}, PURGE_INTERVAL_MS)
purgeTimer.unref?.()

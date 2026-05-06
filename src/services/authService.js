import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { createToken } from '../utils/tokenStore.js'

const SALT_ROUNDS = 10

// In-memory admin store. Populated once at server startup.
const adminStore = {
  username: null,
  passwordHash: null,
}

export const bootstrapAdmin = async () => {
  const { username, password } = env.admin
  if (!username || !password) {
    throw new Error('Admin credentials are not configured')
  }
  adminStore.username = username
  adminStore.passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  console.log(`🔐 Admin "${username}" ready.`)
}

export const login = async ({ username, password }) => {
  if (!adminStore.username || !adminStore.passwordHash) {
    throw ApiError.internal('Admin is not initialized')
  }

  if (username !== adminStore.username) {
    throw ApiError.unauthorized('Invalid credentials')
  }

  const isValid = await bcrypt.compare(password, adminStore.passwordHash)
  if (!isValid) throw ApiError.unauthorized('Invalid credentials')

  const { token, expiresAt } = createToken(username)
  return { token, expiresAt, username }
}

import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { createToken } from '../utils/tokenStore.js'
import { findByUsername } from './userService.js'

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
  // Si el username coincide con el admin, verificar solo contra admin store
  if (adminStore.username && adminStore.passwordHash && username === adminStore.username) {
    const isValid = await bcrypt.compare(password, adminStore.passwordHash)
    if (!isValid) throw ApiError.unauthorized('Invalid credentials')
    const { token, expiresAt } = createToken(username)
    return { token, expiresAt, username }
  }

  // Buscar en la tabla de usuarios de la base de datos
  const user = await findByUsername(username)
  if (!user || !user.password_hash) throw ApiError.unauthorized('Invalid credentials')

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) throw ApiError.unauthorized('Invalid credentials')

  const { token, expiresAt } = createToken(username)
  return { token, expiresAt, username }
}

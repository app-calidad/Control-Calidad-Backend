import bcrypt from 'bcrypt'
import { query } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'

const BASE_SELECT = 'SELECT id, username, email, created_at FROM users'
const SALT_ROUNDS = 10

export const ensureUsersTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // Agrega la columna si la tabla ya existía sin ella
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT ''
  `)
}

export const listUsers = async () => {
  const { rows } = await query(`${BASE_SELECT} ORDER BY id ASC`)
  return rows
}

export const getUserById = async (id) => {
  const { rows } = await query(`${BASE_SELECT} WHERE id = $1`, [id])
  return rows[0] || null
}

const findByEmail = async (email) => {
  const { rows } = await query(`${BASE_SELECT} WHERE email = $1`, [email])
  return rows[0] || null
}

export const findByUsername = async (username) => {
  const { rows } = await query(
    'SELECT id, username, email, password_hash, created_at FROM users WHERE username = $1 LIMIT 1',
    [username],
  )
  return rows[0] || null
}

export const createUser = async ({ username, email, password }) => {
  const existing = await findByEmail(email)
  if (existing) throw ApiError.conflict('A user with that email already exists')

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const { rows } = await query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username, email, passwordHash],
  )
  return rows[0]
}

export const updateUser = async (id, { username, email }) => {
  const existing = await getUserById(id)
  if (!existing) throw ApiError.notFound('User not found')

  if (email && email !== existing.email) {
    const duplicate = await findByEmail(email)
    if (duplicate && duplicate.id !== id) {
      throw ApiError.conflict('A user with that email already exists')
    }
  }

  const nextUsername = username ?? existing.username
  const nextEmail = email ?? existing.email

  const { rows } = await query(
    `UPDATE users
     SET username = $1, email = $2
     WHERE id = $3
     RETURNING id, username, email, created_at`,
    [nextUsername, nextEmail, id],
  )
  return rows[0]
}

export const deleteUser = async (id) => {
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id])
  if (rowCount === 0) throw ApiError.notFound('User not found')
  return true
}

import * as authService from '../services/authService.js'
import * as userService from '../services/userService.js'
import { ApiError } from '../utils/ApiError.js'
import { isNonEmptyString, validateUserPayload } from '../utils/validators.js'

export const login = async (req, res) => {
  const { username, password } = req.body || {}

  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    throw ApiError.badRequest('username and password are required')
  }

  const session = await authService.login({
    username: username.trim(),
    password,
  })

  res.status(200).json({
    message: 'Login successful',
    token: session.token,
    expiresAt: new Date(session.expiresAt).toISOString(),
    username: session.username,
  })
}

export const register = async (req, res) => {
  const { errors, data } = validateUserPayload(req.body || {})
  if (errors.length) throw ApiError.badRequest('Validation failed', errors)

  const user = await userService.createUser(data)
  res.status(201).json({ message: 'Account created successfully', data: user })
}


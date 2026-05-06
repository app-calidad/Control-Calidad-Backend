import * as authService from '../services/authService.js'
import { ApiError } from '../utils/ApiError.js'
import { isNonEmptyString } from '../utils/validators.js'

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

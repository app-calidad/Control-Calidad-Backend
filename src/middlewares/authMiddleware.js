import { ApiError } from '../utils/ApiError.js'
import { getSession } from '../utils/tokenStore.js'

const extractToken = (req) => {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim()
  }
  if (typeof req.headers['x-access-token'] === 'string') {
    return req.headers['x-access-token'].trim()
  }
  return null
}

export const requireAuth = (req, _res, next) => {
  const token = extractToken(req)
  const session = getSession(token)
  if (!session) {
    return next(ApiError.unauthorized('Authentication required'))
  }
  req.auth = { username: session.username, token }
  next()
}

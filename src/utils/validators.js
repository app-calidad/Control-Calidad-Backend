const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0

export const isValidEmail = (value) =>
  typeof value === 'string' && EMAIL_REGEX.test(value.trim())

export const sanitizeString = (value) =>
  typeof value === 'string' ? value.trim() : value

export const validateUserPayload = (payload, { partial = false } = {}) => {
  const errors = []
  const data = {}

  if (!partial || payload.username !== undefined) {
    if (!isNonEmptyString(payload.username)) {
      errors.push('username is required and must be a non-empty string')
    } else if (payload.username.trim().length > 100) {
      errors.push('username must be 100 characters or fewer')
    } else {
      data.username = sanitizeString(payload.username)
    }
  }

  if (!partial || payload.email !== undefined) {
    if (!isValidEmail(payload.email)) {
      errors.push('email is required and must be a valid email address')
    } else if (payload.email.trim().length > 255) {
      errors.push('email must be 255 characters or fewer')
    } else {
      data.email = sanitizeString(payload.email).toLowerCase()
    }
  }

  if (!partial || payload.password !== undefined) {
    if (!isNonEmptyString(payload.password)) {
      errors.push('password is required and must be a non-empty string')
    } else if (payload.password.length < 6) {
      errors.push('password must be at least 6 characters')
    } else {
      data.password = payload.password
    }
  }

  return { errors, data }
}

export const parseId = (raw) => {
  const id = Number.parseInt(raw, 10)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

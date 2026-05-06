import { ApiError } from '../utils/ApiError.js'

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const isApiError = err instanceof ApiError
  const status = isApiError ? err.status : err.status || 500
  const payload = {
    error: {
      message: isApiError || status < 500 ? err.message : 'Internal server error',
    },
  }
  if (isApiError && err.details) payload.error.details = err.details

  if (status >= 500) {
    console.error('💥 Unhandled error:', err)
  }

  res.status(status).json(payload)
}

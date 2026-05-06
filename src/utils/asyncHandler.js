// Wraps async controllers so thrown errors reach the centralized error handler.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

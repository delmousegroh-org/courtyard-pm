export function errorHandler(err, req, res, _next) {
  console.error(err)
  const status = err.status || 400
  res.status(status).json({ error: err.message || 'Something went wrong' })
}

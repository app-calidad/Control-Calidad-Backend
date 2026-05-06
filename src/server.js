import app from './app.js'
import { env } from './config/env.js'
import { connectToDB, pool } from './config/db.js'
import { ensureUsersTable } from './services/userService.js'
import { bootstrapAdmin } from './services/authService.js'

const start = async () => {
  try {
    await connectToDB()
    await ensureUsersTable()
    await bootstrapAdmin()

    const server = app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`)
    })

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`)
      server.close(async () => {
        await pool.end().catch(() => {})
        process.exit(0)
      })
      // Force exit if shutdown stalls.
      setTimeout(() => process.exit(1), 10_000).unref()
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

start()

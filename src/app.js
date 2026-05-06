import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'

const app = express()

app.disable('x-powered-by')
const corsOptions = {
  origin: env.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'Control Calidad Backend',
    status: 'running',
    docs: '/api/health',
  })
})

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app

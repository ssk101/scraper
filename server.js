import express from 'express'
import compression from 'compression'
import cors from 'cors'
import terminator from 'http-terminator'
import http from 'http'
import readline from 'readline'
import config from './config.json' assert { type: 'json' }
import Logger from './utils/logger.js'
import { errorHandler } from './middlewares/error-handler.js'
import routes from './routes.js'

const logger = new Logger('[server]')
const router = express.Router()

router.use(errorHandler)

for(const [path, route] of Object.entries(routes)) {
  const {
    method = 'get',
    handlers,
  } = route

  router[method.toLowerCase()](path, ...handlers)
}

const app = express()
  app.enable('trust proxy')
  app.disable('x-powered-by')
  app.set('startTime', new Date())
  app.use(compression())
  app.use(express.json({
    limit: '50MB',
    strict: true,
    inflate: true,
    type: ['application/json'],
  }))
  app.use(cors({
    methods: ['GET', 'POST', 'PATCH', 'PUT'],
    allowedHeaders: [
      'Content-Type',
    ],
  }))
  app.use(router)

const server = http.createServer(app)
const { createHttpTerminator } = terminator
const graceful = createHttpTerminator({
  gracefulTerminationTimeout: 1 * 1000,
  server,
})

server.listen(config.port)
logger.info('Listening on', config.port)

process.on('SIGUSR2', () => {
  require('v8').writeHeapSnapshot()
})

process.on('SIGABRT', () => {
  terminate('SIGABRT')
})

process.on('SIGTERM', () => {
  terminate('SIGTERM')
})

process.on('SIGINT', () => {
  terminate('SIGINT')
})

process.on('exit', () => {
  server.close()
})

if(process.platform === 'win32') {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.on('SIGINT', () => {
    process.emit('SIGINT')
  })
}

function terminate(signal) {
  server.close(() => {
    graceful.terminate()
      .catch(err => logger.error(err))
      .finally(() => {
        logger.log(signal)
        process.exit()
      })
  })
}

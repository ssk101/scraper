import express from 'express'
import compression from 'compression'
import cors from 'cors'
import terminator from 'http-terminator'
import http from 'http'
import readline from 'readline'
import config from './config.json' assert { type: 'json' }
import { errorHandler } from './middlewares/error-handler.js'
import { routes } from './routes.js'

const { createHttpTerminator } = terminator
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

const graceful = createHttpTerminator({
  gracefulTerminationTimeout: 1 * 1000,
  server,
})

server.listen(config.port)
console.info('Listening on', config.port)

process.on('SIGUSR2', () => {
  require('v8').writeHeapSnapshot()
})

process.on('SIGABRT', () => {
  console.log('SIGABRT')
  hastaLaVista(graceful)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM')
  hastaLaVista(graceful)
})

process.on('SIGINT', () => {
  console.log('SIGINT')
  hastaLaVista(graceful)
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

function exit() {
  hastaLaVista(graceful)
}

function hastaLaVista(baby) {
  server.close(() => {
    baby.terminate()
      .catch(err => heap.error(err))
      .finally(async () => {
        let a = Buffer.from(
          `IllvdSdyZSB0ZXJtaW5hdGVkLCBmdWNrZXIufEtuaXZlcywgYW5kIHN0YWJiaW5nIHdlYXBvbnMufEkgc3dlYXIgSSB3aWxsIG5vdCBraWxsIGFueW9uZS58WW91ciBmb3N0ZXIgcGFyZW50cyBhcmUgZGVhZC58Q29tZSB3aXRoIG1lIGlmIHlvdSB3YW50IHRvIGxpdmUufEhhdmUgeW91IHNlZW4gdGhpcyBib3k/fEkga25vdyBub3cgd2h5IHlvdSBjcnkuIEJ1dCBpdCBpcyBzb21ldGhpbmcgSSBjYW4gbmV2ZXIgZG8ufEknbGwgYmUgYmFjay58VGhlcmUncyBubyBmYXRlIGJ1dCB3aGF0IHdlIG1ha2UufEkgbmVlZCB5b3VyIGNsb3RoZXMsIHlvdXIgYm9vdHMgYW5kIHlvdXIgbW90b3JjeWNsZS58TmljZSBuaWdodCBmb3IgYSB3YWxrLiBOb3RoaW5nIGNsZWFuLCByaWdodD8i`
        , 'base64').toString().split('|')
        console.log('\n', a[Math.floor(Math.random() * a.length)])
        process.exit()
      })
  })
}

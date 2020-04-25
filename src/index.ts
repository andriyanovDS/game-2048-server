import http, { IncomingMessage } from 'http'
import express from 'express'

import bodyParser from 'body-parser'

import environment from './environment'
import { WebSocketServerImpl } from './webSocket'
import { RepositoryMongodb } from './database'
import { setupRoutes } from './routes'

const app = express()
const index = http.createServer(app)

const repository = new RepositoryMongodb()
const socketServer = new WebSocketServerImpl(repository)

app.use(bodyParser.json())
setupRoutes(app, repository)

function authenticate(request: IncomingMessage): string {
  const deviceId = request.headers['auth-token']
  if (!deviceId || typeof deviceId !==  'string') {
    throw Error('User not authorized')
  }
  return deviceId
}

index.on('upgrade', (request, socket, head) => {
  try {
    const deviceId = authenticate(request)
    socketServer.handleUpgrade(request, socket, head, deviceId)
  } catch (e) {
    console.error(e)
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
  }
})

index.listen(environment.port, () => {
  console.log('app start listening on port ' + environment.port)
})
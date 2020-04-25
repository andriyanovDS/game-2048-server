import http, { IncomingMessage } from 'http'
import express from 'express'
import url from 'url'

import bodyParser from 'body-parser'

import environment from './environment'
import { WebSocketRoomList } from './webSocket'
import { RepositoryMongodb } from './database'
import { setupRoutes } from './routes'

const app = express()
const server = http.createServer(app)

const repository = new RepositoryMongodb(() => {
  server.listen(environment.port, () => {
    console.log('app start listening on port ' + environment.port)
  })
})
const roomsSocketServer = new WebSocketRoomList(repository)

app.use(bodyParser.json())
setupRoutes(app, repository)

function authenticate(request: IncomingMessage): string {
  const deviceId = request.headers['auth-token']
  if (!deviceId || typeof deviceId !==  'string') {
    throw Error('User not authorized')
  }
  return deviceId
}

server.on('upgrade', (request, socket, head) => {
  try {
    const deviceId = authenticate(request)
    const pathname = url.parse(request.url).pathname

    if (pathname === '/roomList') {
      roomsSocketServer.handleUpgrade(request, socket, head, deviceId)
    }
  } catch (e) {
    console.error(e)
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
  }
})

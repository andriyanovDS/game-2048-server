import http, { IncomingMessage } from 'http'
import express from 'express'
import url from 'url'

import bodyParser from 'body-parser'

import environment from './environment'
import { RepositoryMongodb } from './database'
import { setupRoutes } from './routes'
import { ExternalGameEvent } from './controllers'
import {
  WebSocketServer,
  RoomClientData,
  roomListResponderBuilder,
  roomResponderBuilder
} from './webSocket'

const app = express()
const server = http.createServer(app)

const repository = new RepositoryMongodb(() => {
  server.listen(environment.port, () => {
    console.log('app start listening on port ' + environment.port)
  })
})

const roomListWebSocketServer = new WebSocketServer(roomListResponderBuilder(repository))

const roomWebSocketServer = new WebSocketServer<RoomClientData, ExternalGameEvent>(
  roomResponderBuilder(repository)
)

app.use(bodyParser.json())
setupRoutes(app, repository)

function authenticate(request: IncomingMessage): string {
  const deviceId = request.headers['auth-token']
  if (!deviceId || typeof deviceId !==  'string') {
    throw Error('User not authorized')
  }
  return deviceId
}

function getRoomIdFromQuery(query: string): string {
  return query.split('=')[1]
}

server.on('upgrade', (request, socket, head) => {
  try {
    const deviceId = authenticate(request)
    const { query, pathname } = url.parse(request.url)

    if (pathname === '/roomList') {
      roomListWebSocketServer.handleUpgrade(request, socket, head, { deviceId })
    }

    if (pathname === '/room') {
      roomWebSocketServer.handleUpgrade(request, socket, head, {
        deviceId,
        roomId: getRoomIdFromQuery(query)
      })
    }
  } catch (e) {
    console.error(e)
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
  }
})

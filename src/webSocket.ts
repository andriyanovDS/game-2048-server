import WebSocket from 'ws'
import { Socket } from 'net'
import { IncomingMessage } from 'http'

import { RepositoryMongodb } from './database'

interface WebSocketClient {

}

export interface WebSocketServer {
  handleUpgrade(request: IncomingMessage, socket: Socket, upgradeHead: Buffer, deviceId: string): void
}

export class WebSocketServerImpl implements WebSocketServer {
  private readonly db: RepositoryMongodb
  private readonly server: WebSocket.Server
  private readonly clients = []

  constructor(db: RepositoryMongodb) {
    this.db = db
    this.server = new WebSocket.Server({ noServer: true })
  }

  handleUpgrade(request: IncomingMessage, socket: Socket, upgradeHead: Buffer, deviceId: string): void {
    this.server.handleUpgrade(request, socket, upgradeHead, (ws) => {
      this.server.emit('connection', ws, request)
    })
  }

  private setupConnection() {
    this.server.on('connection', ws => {

    })
  }
}
import WebSocket from 'ws'
import { Socket } from 'net'
import { IncomingMessage } from 'http'

import { Repository, RepositoryMongodb } from '../database'

export interface WebSocketClient {
  ws: WebSocket
  deviceId: string
}

export interface WebSocketServerInterface {
  handleUpgrade(request: IncomingMessage, socket: Socket, upgradeHead: Buffer, deviceId: string): void
}

export abstract class WebSocketServer<T extends {} = {}> implements WebSocketServerInterface {
  protected readonly db: Repository
  private readonly server: WebSocket.Server
  private readonly clients: Array<WebSocketClient> = []

  constructor(db: RepositoryMongodb) {
    this.db = db
    this.server = new WebSocket.Server({ noServer: true })
    this.setupConnection()
  }

  handleUpgrade(request: IncomingMessage, socket: Socket, upgradeHead: Buffer, deviceId: string): void {
    this.server.handleUpgrade(request, socket, upgradeHead, (ws) => {
      this.server.emit('connection', ws, deviceId)
    })
  }

  private setupConnection() {
    this.server.on('connection', (ws: WebSocket, deviceId: string) => {
      const client: WebSocketClient = { ws, deviceId }
      this.clients.push(client)
      this.onConnect(client)

      ws.on('message', (payload: T) => {
        this.onReceiveMessage(payload)
      })

      ws.on('close', async () => {
        const index = this.clients.findIndex(v => v.deviceId === deviceId)
        this.clients.splice(index, 1)
        this.onClose(client)
      })
    })
  }

  protected onReceiveMessage(_: T): void {}

  protected onConnect(_: WebSocketClient): void {}

  protected onClose(_: WebSocketClient): void {}
}

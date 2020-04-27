import WebSocket from 'ws'
import { Socket } from 'net'
import { IncomingMessage } from 'http'

export interface ClientData {
  deviceId: string
}

export type WebSocketClient<U extends ClientData = ClientData> = U & {
  ws: WebSocket
}

export interface WebSocketServerInterface<U> {
  handleUpgrade(request: IncomingMessage, socket: Socket, upgradeHead: Buffer, clientData: U): void
}

export interface WebSocketResponder<T extends {} = {}> {
  sendMessage: (message: any) => void
  onClientDidConnect: () => void
  onClientDidReceiveMessage?: (message: T) => void
  onClientDidDisconnect: () => void
}

export type WebSocketResponderFactory<
  U extends ClientData = ClientData,
  T extends {} = {}
  > =  (client: WebSocketClient<U>) => Promise<WebSocketResponder<T>>

export class WebSocketServer<
  U extends ClientData = ClientData,
  T extends {} = {}
  > implements WebSocketServerInterface<U> {

  private readonly clientFactory: WebSocketResponderFactory<U, T>
  private readonly server: WebSocket.Server
  private readonly clients = new Map<string, WebSocketResponder<T>>()

  constructor(clientFactory: WebSocketResponderFactory<U, T>) {
    this.clientFactory = clientFactory
    this.server = new WebSocket.Server({ noServer: true })
    this.setupConnection()
  }

  handleUpgrade(request: IncomingMessage, socket: Socket, upgradeHead: Buffer, clientData: U): void {
    this.server.handleUpgrade(request, socket, upgradeHead, (ws) => {
      this.server.emit('connection', ws, clientData)
    })
  }

  private setupConnection() {
    this.server.on('connection', async (ws: WebSocket, clientData: U) => {
      try {
        const client = await this.clientFactory({ ws, ...clientData })
        this.clients.set(clientData.deviceId, client)

        ws.on('message', (payload: string) => {
          if (!client.onClientDidReceiveMessage) { return }
          client.onClientDidReceiveMessage(JSON.parse(payload))
        })

        ws.on('close', async () => {
          this.clients.delete(clientData.deviceId)
          client.onClientDidDisconnect()
        })

        client.onClientDidConnect()
      } catch (e) {
        console.error(e)
        ws.close()
      }
    })
  }
}

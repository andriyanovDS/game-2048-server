import { Subscription } from 'rxjs'
import { CollectionChangeEvent, Repository, Room } from '../../database'
import { WebSocketClient, WebSocketResponder } from '../server'

export class RoomListClient implements WebSocketResponder {
  readonly client: WebSocketClient
  private readonly db: Repository
  private _subscription: Subscription | null = null

  constructor(db: Repository, client: WebSocketClient) {
    this.db = db
    this.client = client
  }

  readonly sendMessage = (message: string): void => {
    this.client.ws.send(message)
  }

  readonly onClientDidConnect = async (): Promise<void> => {
    const rooms = await this.db.getAllAvailableRooms()
    const eventData = rooms.map<CollectionChangeEvent<Room>>(v => ({
      documentId: v.id,
      type: 'insert',
      data: v
    }))
    this.sendMessage(JSON.stringify(eventData))
    this._subscription = this.db.roomListChanges$
      .subscribe((event) => {
        this.sendMessage(JSON.stringify([event]))
      })
  }

  readonly onClientDidDisconnect = (): void => {
    if (this._subscription) {
      this._subscription.unsubscribe()
      this._subscription = null
    }
  }
}
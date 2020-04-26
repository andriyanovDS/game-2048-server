import { Subscription } from 'rxjs'

import { WebSocketClient, WebSocketServer } from './server'
import { CollectionChangeEvent, Room } from '../database'

export class WebSocketRoomList extends WebSocketServer {
  private _subscription: Subscription | null = null

  protected async onConnect(client: WebSocketClient): Promise<void> {
    const rooms = await this.db.getAllAvailableRooms()
    const eventData = rooms.map<CollectionChangeEvent<Room>>(v => ({
      documentId: v.id,
      type: 'insert',
      data: v
    }))
    client.ws.send(JSON.stringify(eventData))
    this._subscription = this.db.subscribeRoomList()
      .subscribe((event) => {
        client.ws.send(JSON.stringify([event]))
      })

  }

  protected onClose(_: WebSocketClient): void {
    if (this._subscription) {
      this._subscription.unsubscribe()
      this._subscription = null
    }
  }
}

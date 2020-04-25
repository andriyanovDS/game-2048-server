import { Subscription } from 'rxjs'

import { WebSocketClient, WebSocketServer } from './server'

export class WebSocketRoomList extends WebSocketServer {
  private _subscription: Subscription | null = null

  protected onConnect(client: WebSocketClient): void {
    this._subscription = this.db.subscribeRoomList()
      .subscribe((event) => {
        client.ws.send(JSON.stringify(event))
      })
  }
}

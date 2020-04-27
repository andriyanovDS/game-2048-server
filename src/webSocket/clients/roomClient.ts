import { Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'

import {
  CollectionChangeEvent,
  CollectionChangeEventInsert,
  Repository,
  Room
} from '../../database'
import { ClientData, WebSocketClient, WebSocketResponder } from '../server'
import { ExternalGameEvent, GameEventInitialCells, GameEventOpponentAction } from './gameEvent'

export interface RoomClientData extends ClientData {
  roomId: string
}

function isGameEventInitialCells(v: ExternalGameEvent): v is GameEventInitialCells {
  return v.type === 'initialCells'
}

function isGameEventOpponentAction(v: ExternalGameEvent): v is GameEventOpponentAction {
  return v.type === 'opponentAction'
}

function isCollectionChangeEventUpdate(v: CollectionChangeEvent<Room>): v is CollectionChangeEventInsert<Room> {
  return v.type === 'update'
}

export class RoomClient implements WebSocketResponder {
  private room: Room
  readonly client: WebSocketClient<RoomClientData>
  private readonly db: Repository
  private readonly isHostUser: boolean
  private readonly roomSubscription: Subscription

  constructor(db: Repository, client: WebSocketClient<RoomClientData>, room: Room, isHostUser: boolean) {
    this.db = db
    this.client = client
    this.room = room
    this.isHostUser = isHostUser

    this.roomSubscription = db.roomListChanges$
      .pipe(
        filter(v => v.documentId === room.id),
        filter(isCollectionChangeEventUpdate)
      )
      .subscribe(v => this.roomDidUpdate(v.data))
  }

  readonly sendMessage = (message: any): void => {
    this.client.ws.send(JSON.stringify(message))
  }

  readonly onClientDidConnect = async (): Promise<void> => {
    if (!this.isHostUser) {
      await this.updateRoom({ guestId: this.client.deviceId })

      if (!this.room.initialCells.length) {
        throw Error('Set initial cells after host join room!')
      }
      this.sendMessage({
        initialCells: this.room.initialCells
      })
      return
    }
  }

  readonly onClientDidReceiveMessage = (message: ExternalGameEvent): void => {
    if (isGameEventInitialCells(message) && this.isHostUser) {
      this.updateRoom({ initialCells: message.initialCells }).catch(console.error)
      return
    }
    if (isGameEventOpponentAction(message)) {
      const actionsCount = this.room.actionsHistory.length
      if (this.isHostUser && actionsCount % 2 !== 0) { return }
      if (!this.isHostUser && actionsCount % 2 === 0) { return }
      this.updateRoom({
        actionsHistory: this.room.actionsHistory.concat([message.action])
      }).catch(console.error)
    }
  }

  readonly onClientDidDisconnect = (): void => {
    this.roomSubscription.unsubscribe()
    if (this.isHostUser) {
      this.db.deleteRoom(this.room.id).catch(console.error)
    } else {
      this.updateRoom({ guestId: void 0 }).catch(console.error)
    }
  }

  private updateRoom(v: Partial<Room>): Promise<void> {
    return this.db.updateRoom({
      ...this.room,
      ...v
    })
  }

  private sendActionIfNeeded(room: Room): void {
    const actionsCount = room.actionsHistory.length
    if (actionsCount === 0) return
    if (this.isHostUser && actionsCount % 2 !== 0) { return }
    if (!this.isHostUser && actionsCount % 2 === 0) { return }

    this.sendMessage({
      action: room.actionsHistory[room.actionsHistory.length - 1]
    })
  }

  private sendUsersIfNeeded(room: Room): void {
    if (this.isHostUser && !this.room.guestId && !!room.guestId) {
      this.sendMessage({
        users: [room.hostId, room.guestId]
      })
    }
  }

  private roomDidUpdate(room: Room): void {
    this.sendUsersIfNeeded(room)
    this.sendActionIfNeeded(room)
    this.room = room
  }
}
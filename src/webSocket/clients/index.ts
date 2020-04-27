import { WebSocketResponderFactory } from '../server'
import { Repository } from '../../database'
import { RoomListClient } from './roomListClient'
import { RoomClient, RoomClientData } from './roomClient'

export { RoomClientData } from './roomClient'

export function roomListResponderBuilder(db: Repository): WebSocketResponderFactory {
  return (v) => Promise.resolve(new RoomListClient(db, v))
}

export function roomResponderBuilder(db: Repository): WebSocketResponderFactory<RoomClientData> {
  return async (v) => {
    const room = await db.getRoom(v.roomId)
    const isHostUser = room.hostId === v.deviceId
    if (!isHostUser && !!room.guestId) {
      throw Error('Room already full')
    }
    return new RoomClient(db, v, room, isHostUser)
  }
}
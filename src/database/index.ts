import { Observable } from 'rxjs'
import mongoose, { Connection } from 'mongoose'
import { ChangeEvent, ChangeEventDelete, ChangeEventUpdate } from 'mongodb'

import environment from '../environment'
export { Room, RoomModel } from './models'
import { Room, RoomModel } from './models'

export interface Repository {
  db: Connection
  createRoom(deviceId: string): Promise<string>
  deleteRoom(roomId: string): Promise<void>
}

export type CollectionChangeEventUpdate<T extends {}> = {
  type: 'update' | 'insert'
  documentId: string
  data?: T
}

export type CollectionChangeEventDelete<T extends {}> = {
  type: 'delete'
  documentId: string
}

export type CollectionChangeEvent<T extends {}> =
  CollectionChangeEventUpdate<T>
  | CollectionChangeEventDelete<T>

function isChangeEventInsert(e: ChangeEvent): e is ChangeEventUpdate {
  return e.operationType === 'insert'
}

function isChangeEventUpdate(e: ChangeEvent): e is ChangeEventUpdate {
  return e.operationType === 'update'
}

function isChangeEventDelete(e: ChangeEvent): e is ChangeEventDelete {
  return e.operationType === 'delete'
}

export class RepositoryMongodb implements Repository {
  readonly db: Connection

  constructor(onLoad: () => void) {
    mongoose
      .connect(environment.databaseURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }).catch(console.error)
    this.db = mongoose.connection

    mongoose.connection
      .once('open', onLoad)
      .on('error', console.error)
  }

  readonly createRoom = (deviceId: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      RoomModel.create({ hostId: deviceId }, (error, room) => {
        if (error) {
          reject(error)
          return
        }
        console.log('Did create room', room._id)
        resolve(room._id)
      })
    })
  }

  readonly deleteRoom = (roomId: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      RoomModel.findById(roomId, (error, room) => {
        if (error) {
          reject(error)
          return
        }
        room.remove(resolve)
      })
    })
  }

  readonly subscribeRoomList = (): Observable<CollectionChangeEvent<Room>> => {
    return new Observable<CollectionChangeEvent<Room>>((o) => {
      const roomListCollection = this.db.collection('rooms')
      const changeStream = roomListCollection.watch()

      changeStream.on('change', (event) => {
        if (isChangeEventInsert(event) || isChangeEventUpdate(event)) {
          o.next({
            documentId: event.documentKey._id.toHexString(),
            type: event.operationType,
            data: {
              id: event.fullDocument._id,
              hostId: event.fullDocument.hostId
            }
          })
          return
        }
        if (isChangeEventDelete(event)) {
          o.next({
            documentId: event.documentKey._id.toHexString(),
            type: event.operationType
          })
          return
        }
      })

      changeStream.on('error', (error) => o.error(error))
      return () => {
        changeStream.removeAllListeners()
        changeStream.close()
      }
    })
  }
}

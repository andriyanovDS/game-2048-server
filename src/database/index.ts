import { Observable } from 'rxjs'
import mongoose, { Connection } from 'mongoose'
import { ChangeEvent, ChangeEventDelete, ChangeEventUpdate } from 'mongodb'

import environment from '../environment'
export { Room, RoomModel } from './models'
import { Room, RoomModel } from './models'

export type CreateRoomParams = {
  hostName: string
  deviceId: string
  boardSize: number
}

export interface Repository {
  db: Connection
  createRoom(params: CreateRoomParams): Promise<string>
  deleteRoom(roomId: string): Promise<void>
  getAllAvailableRooms(): Promise<ReadonlyArray<Room>>
  subscribeRoomList(): Observable<CollectionChangeEvent<Room>>
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

  readonly createRoom = (params: CreateRoomParams): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const { deviceId, ...data } = params
      RoomModel.create({ ...data, hostId: deviceId }, (error, room) => {
        if (error) {
          reject(error)
          return
        }
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

  readonly getAllAvailableRooms = (): Promise<ReadonlyArray<Room>> => {
    return new Promise<ReadonlyArray<Room>>((resolve, reject) => {
      RoomModel.find((error, documents: ReadonlyArray<any>) => {
        if (error) {
          reject(error)
          return
        }
        resolve(documents.map((v) => ({
          id: v._id,
          hostName: v.hostName,
          boardSize: v.boardSize,
          hostId: v.hostId
        })))
      })
    })
  }

  readonly subscribeRoomList = (): Observable<CollectionChangeEvent<Room>> => {
    return new Observable<CollectionChangeEvent<Room>>((o) => {
      const roomListCollection = this.db.collection('rooms')
      const changeStream = roomListCollection.watch()

      changeStream.on('change', (event) => {
        if (isChangeEventInsert(event) || isChangeEventUpdate(event)) {
          const { _id: id, ...doc } = event.fullDocument
          o.next({
            documentId: event.documentKey._id.toHexString(),
            type: event.operationType,
            data: { id, ...doc }
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

import { Observable } from 'rxjs'
import { share } from 'rxjs/operators'
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
  roomListChanges$: Observable<CollectionChangeEvent<Room>>
  updateRoom(room: Room): Promise<void>
  getRoom(deviceId: string): Promise<Room>
  createRoom(params: CreateRoomParams): Promise<string>
  deleteRoom(roomId: string): Promise<void>
  getAllAvailableRooms(): Promise<ReadonlyArray<Room>>
}

export type CollectionChangeEventInsert<T extends {}> = {
  type: 'update' | 'insert'
  documentId: string
  data?: T
}

export type CollectionChangeEventDelete = {
  type: 'delete'
  documentId: string
}

export type CollectionChangeEvent<T extends {}> =
  CollectionChangeEventInsert<T>
  | CollectionChangeEventDelete

function isChangeEventInsert(e: ChangeEvent): e is ChangeEventUpdate {
  return e.operationType === 'insert'
}

export function isChangeEventUpdate(e: ChangeEvent): e is ChangeEventUpdate {
  return e.operationType === 'update'
}

function isChangeEventDelete(e: ChangeEvent): e is ChangeEventDelete {
  return e.operationType === 'delete'
}

function modelToRoom(v: RoomModel): Room {
  return {
    id: v._id.toHexString(),
    hostName: v.hostName,
    boardSize: v.boardSize,
    hostId: v.hostId,
    initialCells: v.initialCells,
    actionsHistory: v.actionsHistory
  }
}

export class RepositoryMongodb implements Repository {
  readonly db: Connection
  roomListChanges$: Observable<CollectionChangeEvent<Room>>

  constructor(onLoad: () => void) {
    mongoose
      .connect(environment.databaseURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      }).catch(console.error)
    this.db = mongoose.connection

    mongoose.connection
      .once('open', () => {
        this.roomListChanges$ = this.subscribeRoomList()
        onLoad()
      })
      .on('error', console.error)
  }

  getRoom(roomId: string): Promise<Room> {
    return new Promise<Room>((resolve, reject) => {
      RoomModel.findById(roomId, (error, room) => {
        if (error) {
          reject(error)
          return
        }
        resolve(modelToRoom(room))
      })
    })
  }

  readonly createRoom = (params: CreateRoomParams): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const { deviceId, ...data } = params
      const room: Omit<Room, 'id'> = {
        ...data,
        hostId: deviceId,
        initialCells: [],
        actionsHistory: []
      }
      RoomModel.create(room, (error, room) => {
        if (error) {
          reject(error)
          return
        }
        resolve(room._id)
      })
    })
  }

  updateRoom(room: Room): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      RoomModel.findByIdAndUpdate(room.id, { _id: room.id, ...room }, (error, data) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  deleteRoom(roomId: string): Promise<void> {
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

  getAllAvailableRooms(): Promise<ReadonlyArray<Room>> {
    return new Promise<ReadonlyArray<Room>>((resolve, reject) => {
      RoomModel.find((error, documents: ReadonlyArray<any>) => {
        if (error) {
          reject(error)
          return
        }
        resolve(documents.map(modelToRoom))
      })
    })
  }

  private subscribeRoomList(): Observable<CollectionChangeEvent<Room>> {
    return new Observable<CollectionChangeEvent<Room>>((o) => {

      const roomListCollection = this.db.collection('rooms')
      const changeStream = roomListCollection.watch()

      changeStream.on('change', (event) => {
        if (isChangeEventInsert(event)) {
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
        if (isChangeEventUpdate(event)) {
          this.getRoom(event.documentKey._id.toHexString())
            .then(v => {
              o.next({
                documentId: v.id,
                type: 'update',
                data: v
              })
            })
        }
      })

      changeStream.on('error', (error) => o.error(error))
      return () => {
        changeStream.removeAllListeners()
        changeStream.close()
      }
    }).pipe(share())
  }
}

import { MongoClient, Db } from 'mongodb'
import * as uuid from 'uuid'
import environment from '../environment'

export interface Repository {
  createRoom(deviceId: string): Promise<string>
  deleteRoom(roomId: string): Promise<void>
  dispose()
}

export class RepositoryMongodb implements Repository {
  private db: Db | null = null
  private client: MongoClient | null = null

  constructor() {
    this.createDb()
  }

  private createDb() {
    const client = new MongoClient(environment.databaseURL, { useUnifiedTopology: true })
    client.connect(error => {
      if (error) {
        console.error(error)
        return
      }
      this.db = client.db(environment.databaseName)
      this.client = client
    })
  }

  readonly dispose = (): void => {
    if (!this.client) { return }
    this.client.close()
  }

  readonly createRoom = async (deviceId: string): Promise<string> => {
    if (!this.db) { return }
    const roomId = uuid.v4()
    await this.db.collection('room').insertOne({
      id: roomId,
      users: [deviceId]
    })
    return roomId
  }

  readonly deleteRoom = async (roomId: string): Promise<void> => {
    if (!this.db) { return }

    const { result } = await this.db.collection('room').deleteOne({ id: roomId })
    if (result.ok !== 1) {
      throw Error('Failed to delete room')
    }
  }
}
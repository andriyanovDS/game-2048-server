import { Schema, model } from 'mongoose'

export interface Room {
  id: string
  hostId: string
  hostName: string
  guestId?: string
  boardSize: number
}

const roomSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  hostId: { type:  Schema.Types.String },
  hostName: { type:  Schema.Types.String },
  boardSize: { type:  Schema.Types.Number },
  guestId: { type:  Schema.Types.String, required: false }
})

export const RoomModel = model('Room', roomSchema)

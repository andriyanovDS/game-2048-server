import { Schema, model } from 'mongoose'

export interface Room {
  id: string
  hostId: string
  guestId?: string
}

const roomSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  hostId: { type:  Schema.Types.String },
  guestId: { type:  Schema.Types.String, required: false }
})

export const RoomModel = model('Room', roomSchema)

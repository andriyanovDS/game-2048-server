import { Schema, model, Document } from 'mongoose'

export enum UserAction {
  right = 'right',
  left = 'left',
  up = 'up',
  down = 'down'
}

export type CellPosition = {
  index: number
  row: number
}

export type InitialCell = {
  position: CellPosition
  value: number
}

export interface Room {
  id: string
  hostId: string
  hostName: string
  guestId?: string
  boardSize: number
  initialCells: ReadonlyArray<InitialCell>
  actionsHistory: ReadonlyArray<UserAction>
}

export type RoomModel = Document & Room

const positionSchema = new Schema({
  index: { type:  Schema.Types.Number },
  row: { type:  Schema.Types.Number }
})

const initialCell = new Schema({
  position: positionSchema,
  value: { type:  Schema.Types.Number }
})

const roomSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  hostId: { type: Schema.Types.String },
  hostName: { type: Schema.Types.String },
  boardSize: { type: Schema.Types.Number },
  guestId: { type: Schema.Types.String, required: false },
  initialCells: [initialCell],
  actionsHistory: [{
    type: Schema.Types.String
  }]
})

export const RoomModel = model<RoomModel>('Room', roomSchema)

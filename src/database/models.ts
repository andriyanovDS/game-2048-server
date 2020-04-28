import { Schema, model, Document } from 'mongoose'

export enum UserActionDirection {
  right = 'right',
  left = 'left',
  up = 'up',
  down = 'down'
}

export type CellPosition = {
  indexes: [number, number]
}

export type SharedCell = {
  position: CellPosition
  value: number
}

export type OpponentAction = {
  direction: UserActionDirection
  generatedCell?: SharedCell
}

export interface Room {
  id: string
  hostId: string
  hostName: string
  guestId?: string
  boardSize: number
  initialCells: ReadonlyArray<SharedCell>
  actionsHistory: ReadonlyArray<OpponentAction>
}

export type RoomModel = Document & Room

const positionSchema = new Schema({
  indexes: [{
    type: Schema.Types.Number
  }]
})

const cellSchema = new Schema({
  position: positionSchema,
  value: { type:  Schema.Types.Number }
})

const opponentActionSchema = new Schema({
  direction: { type: Schema.Types.String },
  generatedCell: cellSchema
})

const roomSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  hostId: { type: Schema.Types.String },
  hostName: { type: Schema.Types.String },
  boardSize: { type: Schema.Types.Number },
  guestId: { type: Schema.Types.String },
  initialCells: [cellSchema],
  actionsHistory: [opponentActionSchema]
})

export const RoomModel = model<RoomModel>('Room', roomSchema)

import { SharedCell, UserActionDirection } from '../../database/models'

export type GameEventType =
  'hostDidDisconnect'
  | 'opponentDidDisconnect'
  | 'opponentAction'
  | 'initialCells'

export interface GameEvent {
  type: GameEventType
}

export interface GameEventInitialCells extends GameEvent {
  type: 'initialCells'
  initialCells: ReadonlyArray<SharedCell>
}

export interface GameEventOpponentAction {
  type: 'opponentAction'
  direction: UserActionDirection
  generatedCell: SharedCell
}

export type ExternalGameEvent = GameEventOpponentAction | GameEventInitialCells
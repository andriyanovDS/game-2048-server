import { InitialCell, UserAction } from '../../database/models'

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
  initialCells: ReadonlyArray<InitialCell>
}

export interface GameEventOpponentAction {
  type: 'opponentAction'
  action: UserAction
}

export type ExternalGameEvent = GameEventOpponentAction | GameEventInitialCells
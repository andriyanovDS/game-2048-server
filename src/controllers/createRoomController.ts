import { Request, Response } from 'express-serve-static-core'
import { CreateRoomParams, Repository } from '../database'

export type CreateRoomSuccessResponse = {
  roomId: string
}

export type CreateRoomErrorResponse = {
  errorMessage: string
}

export type CreateRoomResponse = CreateRoomSuccessResponse | CreateRoomErrorResponse

export async function createRoomController(
  request: Request<{}, CreateRoomResponse, CreateRoomParams>,
  response: Response<CreateRoomResponse>,
  repository: Repository
): Promise<void> {
  const { deviceId, boardSize, hostName } = request.body
  if (!deviceId || !boardSize || !hostName) {
    response.statusCode = 500
    response.send({ errorMessage: 'Invalid params' })
    return
  }
  try {
    const roomId = await repository.createRoom(request.body)
    response.statusCode = 200
    response.send({ roomId })
  } catch (e) {
    console.error(e)
    response.statusCode = 500
    response.send(e.message)
  }
}

import { Request, Response } from 'express-serve-static-core'
import { Repository } from '../database'

export type CreateRoomParams = {
  deviceId: string
}

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
  const { deviceId } = request.body
  if (!deviceId) {
    response.statusCode = 500
    response.send({ errorMessage: "uuid missed in request body!" })
    return
  }
  try {
    const roomId = await repository.createRoom(deviceId)
    response.statusCode = 200
    response.send({ roomId })
  } catch (e) {
    console.error(e)
    response.statusCode = 500
    response.send(e.message)
  }
}
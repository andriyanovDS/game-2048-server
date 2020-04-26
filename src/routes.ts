import { Express, ParamsDictionary } from 'express-serve-static-core'

import { CreateRoomParams, Repository } from './database'
import {
  createDeviceIdController,
  CreateDeviceIdResponse,
  createRoomController,
  CreateRoomResponse
} from './controllers'

export function setupRoutes(
  app: Express,
  repository: Repository
): void {

  app.get<ParamsDictionary, CreateDeviceIdResponse>('/deviceId', (request, response) => {
    createDeviceIdController(request, response).catch(console.error)
  })

  app.post<ParamsDictionary, CreateRoomResponse, CreateRoomParams>('/room', (request, response) => {
    createRoomController(request, response, repository).catch(console.error)
  })
}

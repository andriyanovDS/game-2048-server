import { Request, Response } from 'express-serve-static-core'
import * as uuid from 'uuid'

export type CreateDeviceIdResponse = {
  deviceId: string
}

export async function createDeviceIdController(
  request: Request<{}, CreateDeviceIdResponse>,
  response: Response<CreateDeviceIdResponse>
): Promise<void> {
  response.statusCode = 200
  response.send({ deviceId: uuid.v4() })
}
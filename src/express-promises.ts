import { Application } from 'express'
import { Server } from 'http'

/**
 * Start an Express application on the given port, returning a Promise.
 * The Promise is resolved only as soon as the server is listening.
 *
 * @param app The application to start.
 * @param port The port to listen on.
 * @param hostname The hostname to listen on.
 * @returns A Promise that resolves to the started HTTP server.
 */
export async function promisifiedListen (app: Application, port: number, hostname?: string): Promise<Server> {
  return await new Promise((resolve, reject) => {
    const httpServer = hostname != null ? app.listen(port, hostname) : app.listen(port)
    httpServer.once('listening', () => resolve(httpServer))
    httpServer.once('error', reject)
  })
}

/**
 * Stop listening for requests.
 * The returned Promise is resolved only as soon as the port is free again.
 *
 * @param server The server to close.
 * @returns A Promise that resolves when done.
 */
export async function promisifiedClose (server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((err) => {
    if (err != null) {
      reject(err)
    } else {
      resolve()
    }
  }))
}

import EventEmitter from 'node:events'

/**
 * Interface for Express-like objects that can be started with a listen() method.
 */
interface Listenable<ServerType extends EventEmitter> {
  listen: ((port: number, hostname: string, callback?: () => void) => ServerType) &
    ((port: number, callback?: () => void) => ServerType) &
    ((callback?: () => void) => ServerType)
}

/**
 * Interface for Express-like objects that can be closed with a close() method.
 */
interface Closable extends EventEmitter {
  close: (cb: (err?: Error) => void) => any
}

/**
 * Invoke the object's callback-based listen() method, returning a Promise to the created server.
 * The Promise is resolved only as soon as the server is listening, as indicated by its 'listening' event.
 *
 * This function can be used to start Express applications, but also regular http.Server instances etc.,
 * as long as they have a compatible listen() method.
 *
 * @param app The application to start.
 * @param port The port to listen on.
 * @param hostname The hostname to listen on.
 * @returns A Promise that resolves to the started server.
 */
export async function promisifiedListen<ServerType extends EventEmitter> (app: Listenable<ServerType>, port: number, hostname?: string): Promise<ServerType> {
  return await new Promise((resolve, reject) => {
    const httpServer = hostname != null ? app.listen(port, hostname) : app.listen(port)
    httpServer.once('listening', () => resolve(httpServer))
    httpServer.once('error', reject)
  })
}

/**
 * Invoke the object's callback-based close() method, returning a Promise.
 *
 * This is intended to stop http.Server instances but can be used for anything with a compatible close() method.
 *
 * @param server The server to close.
 * @returns A Promise that resolves when done.
 */
export async function promisifiedClose (server: Closable): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((err) => {
    if (err != null) {
      reject(err)
    } else {
      resolve()
    }
  }))
}

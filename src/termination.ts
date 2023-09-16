import { constants } from 'node:os'

export type TerminationCallback = (signal: NodeJS.Signals) => (void | Promise<void>)

class Terminator {
  private exiting = false
  private readonly callbacks: TerminationCallback[] = []

  async handleSignal (signal: NodeJS.Signals): Promise<void> {
    if (this.exiting) {
      return
    }
    this.exiting = true
    // Invoke in reverse order in case any callbacks registered later depend on things registered earlier
    for (let i = this.callbacks.length - 1; i >= 0; --i) {
      await this.callbacks[i](signal)
    }
    // POSIX process exit code is typically 128+signal, such as 143 for SIGTERM
    process.exit(128 + constants.signals[signal])
  }

  registerCallback (callback: TerminationCallback): void {
    this.callbacks.push(callback)
  }
}

const handler = new Terminator()

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void handler.handleSignal(signal)
  })
}

/**
 * Register a callback for when termination of the process is requested via an external signal. When a signal is
 * received, all callbacks will be run serially in reverse order, and then the process will exit.
 * Explicit termination such as via process.exit() will not invoke any of the callbacks.
 *
 * The callback can be asynchronous, returning a Promise. Still it is required to limit the total amount of time spent
 * in termination callbacks, since the OS (or container orchestration) might forcefully kill the process a few seconds
 * after the signal.
 *
 * @param fn The callback to register.
 */
export function onTermination (fn: TerminationCallback): void {
  handler.registerCallback(fn)
}

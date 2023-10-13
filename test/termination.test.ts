import assert from 'node:assert'
import { ChildProcess, fork } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import * as url from 'node:url'

async function waitUntil (condition: () => boolean, timeout: number): Promise<void> {
  const start = Date.now()
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('timeout')
    }
    await delay(100)
  }
}

describe('termination.ts', function () {
  const FIXTURE_PATH = url.fileURLToPath(new URL('termination-fixture.ts', import.meta.url))

  async function performSignalTest (signal: NodeJS.Signals): Promise<{ fixture: ChildProcess, outLines: string[] }> {
    const fixture = fork(FIXTURE_PATH, {
      // Make available stdout and stderr
      silent: true,
      // Run with ts-node loader but prevent it from causing an ExperimentalWarning, which would invalidate the tests
      execArgv: ['--loader=ts-node/esm', '--no-warnings']
    })

    assert.ok(fixture.stdout, 'expected child process to have stdout')
    assert.ok(fixture.stderr, 'expected child process to have stderr')

    const outLines: string[] = []
    const errLines: string[] = []
    fixture.stdout?.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(line => line.length > 0)
      outLines.push(...lines)
    })
    fixture.stderr?.on('data', (chunk: Buffer) => {
      // Filter out warnings emitted due to presence of ts-node loader
      const lines = chunk.toString().split('\n').filter(line => line.length > 0)
      errLines.push(...lines)
    })

    await waitUntil(() => (outLines.length + errLines.length) > 0, 6000)
    assert.ok(fixture.kill(signal), 'expected kill to succeed')
    await waitUntil(() => fixture.exitCode != null || fixture.signalCode != null, 4000)

    assert.strictEqual(errLines.length, 0)

    return { fixture, outLines }
  }

  it('runs callbacks on SIGTERM', async function () {
    // Windows has no signal support
    if (process.platform === 'win32') {
      this.skip()
      return
    }

    this.slow(3000)
    this.timeout(10000)

    const { fixture, outLines } = await performSignalTest('SIGTERM')

    assert.strictEqual(fixture.exitCode, 143)
    assert.deepStrictEqual(outLines, [
      'started',
      't2: SIGTERM',
      't1: SIGTERM',
      't0: SIGTERM'
    ])
  })

  it('runs callbacks on SIGINT', async function () {
    // Windows has no signal support
    if (process.platform === 'win32') {
      this.skip()
      return
    }

    this.slow(3000)
    this.timeout(10000)

    const { fixture, outLines } = await performSignalTest('SIGINT')

    assert.strictEqual(fixture.exitCode, 130)
    assert.deepStrictEqual(outLines, [
      'started',
      't2: SIGINT',
      't1: SIGINT',
      't0: SIGINT'
    ])
  })

  it('does not run callbacks on SIGKILL', async function () {
    // Windows has no signal support
    if (process.platform === 'win32') {
      this.skip()
      return
    }

    this.slow(3000)
    this.timeout(10000)

    const { fixture, outLines } = await performSignalTest('SIGKILL')

    assert.strictEqual(fixture.exitCode, null)
    assert.strictEqual(fixture.signalCode, 'SIGKILL')
    assert.deepStrictEqual(outLines, [
      'started'
    ])
  })
})

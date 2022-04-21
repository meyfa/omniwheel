import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ChildProcess, fork } from 'child_process'
import { setTimeout as delay } from 'timers/promises'
import * as url from 'url'

chai.use(chaiAsPromised)

async function waitUntil (condition: () => boolean, timeout: number): Promise<void> {
  const start = Date.now()
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('timeout')
    }
    await delay(100)
  }
}

describe('/lib/termination', function () {
  const FIXTURE_PATH = url.fileURLToPath(new URL('termination-fixture.ts', import.meta.url))

  async function performSignalTest (signal: NodeJS.Signals): Promise<{ fixture: ChildProcess, outLines: string[] }> {
    const fixture = fork(FIXTURE_PATH, {
      // Make available stdout and stderr
      silent: true,
      // Run with ts-node loader
      execArgv: ['--loader=ts-node/esm']
    })

    expect(fixture.stdout).to.be.an('object')
    expect(fixture.stderr).to.be.an('object')

    const outLines: string[] = []
    const errLines: string[] = []
    fixture.stdout?.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(line => line.length > 0)
      outLines.push(...lines)
    })
    fixture.stderr?.on('data', (chunk: Buffer) => {
      // Filter out warnings emitted due to presence of ts-node loader
      const lines = chunk.toString().split('\n').filter(line => line.length > 0 && !/ExperimentalWarning|--experimental-loader|--trace-warnings/.test(line))
      errLines.push(...lines)
    })

    await waitUntil(() => (outLines.length + errLines.length) > 0, 6000)
    expect(fixture.kill(signal)).to.equal(true)
    await waitUntil(() => fixture.exitCode != null || fixture.signalCode != null, 4000)

    expect(errLines).to.deep.equal([])

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

    expect(fixture.exitCode).to.equal(143)
    expect(outLines).to.deep.equal([
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

    expect(fixture.exitCode).to.equal(130)
    expect(outLines).to.deep.equal([
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

    expect(fixture.exitCode).to.equal(null)
    expect(fixture.signalCode).to.equal('SIGKILL')
    expect(outLines).to.deep.equal([
      'started'
    ])
  })
})

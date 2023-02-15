import assert from 'node:assert'
import http from 'http'
import express from 'express'
import { promisifiedClose, promisifiedListen } from '../src/server-promises.js'

describe('server-promises.ts', function () {
  const serversToCleanUp: http.Server[] = []

  afterEach(async function () {
    for (const server of serversToCleanUp) {
      await new Promise((resolve) => server.close(resolve))
    }
    serversToCleanUp.splice(0, serversToCleanUp.length)
  })

  describe('promisifiedListen()', function () {
    it('resolves with a started server', async function () {
      const server = await promisifiedListen(express(), 3333)
      serversToCleanUp.push(server)
      assert.strictEqual(server.listening, true)
      const address = server.address()
      assert.ok(typeof address === 'object')
      assert.strictEqual(address?.port, 3333)
    })

    it('rejects if trying to start on a used port', async function () {
      serversToCleanUp.push(await promisifiedListen(express(), 3333))
      await assert.rejects(promisifiedListen(express(), 3333), { code: 'EADDRINUSE' })
    })

    it('works for plain http.Server', async function () {
      // The function was initially implemented for express.Application only, but expanded to be more generic.
      const server = await promisifiedListen(http.createServer(), 3333)
      serversToCleanUp.push(server)
      assert.strictEqual(server.listening, true)
      const address = server.address()
      assert.ok(typeof address === 'object')
      assert.strictEqual(address?.port, 3333)
    })
  })

  describe('promisifiedClose()', function () {
    it('resolves as soon as the server is closed', async function () {
      const server = http.createServer().listen(3333)
      serversToCleanUp.push(server)
      assert.strictEqual(server.listening, true)
      assert.ok(server.address())
      await promisifiedClose(server)
      assert.strictEqual(server.listening, false)
      assert.strictEqual(server.address(), null)
    })

    it('rejects if the server was not running', async function () {
      const server = http.createServer()
      assert.strictEqual(server.address(), null)
      await assert.rejects(promisifiedClose(server), /not running/)
    })

    it('rejects if called twice on the same instance', async function () {
      const server = http.createServer().listen(3333)
      serversToCleanUp.push(server)
      await assert.doesNotReject(promisifiedClose(server))
      await assert.rejects(promisifiedClose(server), /not running/)
    })
  })
})

import express from 'express'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import * as http from 'http'
import { promisifiedClose, promisifiedListen } from '../lib/express-promises.js'

chai.use(chaiAsPromised)

describe('/lib/express-promises', function () {
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
      // if the server was not started yet, the address() would be null
      expect(server.address()).to.have.property('port').that.equals(3333)
    })

    it('rejects if trying to start on a used port', async function () {
      serversToCleanUp.push(await promisifiedListen(express(), 3333))
      await expect(promisifiedListen(express(), 3333)).to.eventually.be.rejectedWith('EADDRINUSE')
    })
  })

  describe('promisifiedClose()', function () {
    it('resolves as soon as the server is closed', async function () {
      const server = http.createServer().listen(3333)
      serversToCleanUp.push(server)
      expect(server.address()).to.have.property('port').that.equals(3333)
      await expect(promisifiedClose(server)).to.eventually.be.fulfilled
      expect(server.address()).to.equal(null)
    })

    it('rejects if the server was not running', async function () {
      const server = http.createServer()
      expect(server.address()).to.equal(null)
      await expect(promisifiedClose(server)).to.eventually.be.rejectedWith('not running')
    })
  })
})

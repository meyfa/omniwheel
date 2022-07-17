import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { HttpStatus } from '../src/index.js'

chai.use(chaiAsPromised)

describe('http-status.ts', function () {
  describe('HttpStatus', function () {
    it('is an enum of HTTP status codes', async function () {
      expect(HttpStatus.CONTINUE).to.equal(100)
      expect(HttpStatus.OK).to.equal(200)
      expect(HttpStatus.MULTIPLE_CHOICES).to.equal(300)
      expect(HttpStatus.BAD_REQUEST).to.equal(400)
      expect(HttpStatus.IM_A_TEAPOT).to.equal(418)
      expect(HttpStatus.INTERNAL_SERVER_ERROR).to.equal(500)
    })
  })
})

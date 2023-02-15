import assert from 'node:assert'
import { HttpStatus } from '../src/index.js'

describe('http-status.ts', function () {
  describe('HttpStatus', function () {
    it('is an enum of HTTP status codes', async function () {
      assert.strictEqual(HttpStatus.CONTINUE, 100)
      assert.strictEqual(HttpStatus.OK, 200)
      assert.strictEqual(HttpStatus.MULTIPLE_CHOICES, 300)
      assert.strictEqual(HttpStatus.BAD_REQUEST, 400)
      assert.strictEqual(HttpStatus.IM_A_TEAPOT, 418)
      assert.strictEqual(HttpStatus.INTERNAL_SERVER_ERROR, 500)
    })
  })
})

import { onTermination } from '../src/termination.js'

/*
 * This file is started as its own process by termination.test.ts
 */

onTermination((signal) => console.log(`t0: ${signal}`))
onTermination(async (signal) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  console.log(`t1: ${signal}`)
})
onTermination((signal) => console.log(`t2: ${signal}`))

// Keep the process running for a few seconds so the signal can be sent
setTimeout(() => {
  console.log('timeout!')
}, 5000)

console.log('started')

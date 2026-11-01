import 'fake-indexeddb/auto'
import { createIndexedDbStorage } from './indexed-db.js'
import { runPortConformanceSuite } from './port.js'

let dbCounter = 0

runPortConformanceSuite('indexed-db', async () => {
  const uniqueDb = `conformance-${++dbCounter}`
  await new Promise((resolve) => {
    indexedDB.deleteDatabase(uniqueDb).onsuccess = resolve
  })
  return createIndexedDbStorage({ dbName: uniqueDb })
})

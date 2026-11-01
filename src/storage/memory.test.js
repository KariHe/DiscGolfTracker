import { createMemoryStorage } from './memory.js'
import { runPortConformanceSuite } from './port.js'

runPortConformanceSuite('memory', async () => createMemoryStorage())

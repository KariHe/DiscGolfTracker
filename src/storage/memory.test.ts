import { createMemoryStorage } from './memory.ts'
import { runPortConformanceSuite } from './port.ts'

runPortConformanceSuite('memory', async () => createMemoryStorage())

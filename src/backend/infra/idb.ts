import { openDB, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION, STORE_GRID, STORE_META, STORE_USERS } from '@/shared/constants/db'

// Re-export for existing import sites within backend
export { DB_NAME, DB_VERSION, STORE_GRID, STORE_META, STORE_USERS } from '@/shared/constants/db'

// Centralized IndexedDB configuration and opener

let cachedDb: IDBPDatabase | null = null

export async function openDatabase(): Promise<IDBPDatabase> {
  if (cachedDb) return cachedDb
  cachedDb = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_GRID)) {
        database.createObjectStore(STORE_GRID)
      }
      if (!database.objectStoreNames.contains(STORE_META)) {
        database.createObjectStore(STORE_META)
      }
      if (!database.objectStoreNames.contains(STORE_USERS)) {
        database.createObjectStore(STORE_USERS)
      }
    },
  })
  // Ensure we don't block future upgrades
  cachedDb.onversionchange = () => {
    try {
      cachedDb?.close()
    } finally {
      cachedDb = null
    }
  }
  return cachedDb
}

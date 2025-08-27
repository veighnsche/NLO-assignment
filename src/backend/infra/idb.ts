import { openDB, type IDBPDatabase } from 'idb'

// Centralized IndexedDB configuration and opener
export const DB_NAME = 'nlo-db'
export const DB_VERSION = 2
export const STORE_GRID = 'grid'
export const STORE_META = 'meta'
export const STORE_USERS = 'users'

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

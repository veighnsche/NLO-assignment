import type { IDBPDatabase } from 'idb'
import type { GridState } from '../schema'
import type { Targets } from '../seed'
import type { User } from '../users'

// Centralized in-memory singletons with typed accessors
let dbRef: IDBPDatabase | null = null
let memoryRef: GridState | null = null
let targetsRef: Targets = {}
let usersRef: Record<string, User> | null = null

export function getDbRef(): IDBPDatabase | null {
  return dbRef
}
export function setDbRef(db: IDBPDatabase | null): void {
  dbRef = db
}

export function getMemory(): GridState | null {
  return memoryRef
}
export function setMemory(state: GridState | null): void {
  memoryRef = state
}

export function getTargets(): Targets {
  return targetsRef
}
export function setTargets(t: Targets): void {
  targetsRef = t
}

export function getUsersMemory(): Record<string, User> | null {
  return usersRef
}
export function setUsersMemory(u: Record<string, User> | null): void {
  usersRef = u
}

export function ensureBooted(state: GridState | null): asserts state is GridState {
  if (!state) throw new Error('Database not booted. Call bootDatabase() first.')
}

import type { GridState } from '../domain/grid/schema'
import type { Targets } from '../domain/grid/seed'
import type { User } from '../domain/users/model'

// Centralized in-memory singletons with typed accessors
let memoryRef: GridState | null = null
let targetsRef: Targets = {}
let usersRef: Record<string, User> | null = null

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

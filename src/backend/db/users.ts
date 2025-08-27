import { createXorShift32, type RNG } from './rng'

export interface User {
  id: string
  name: string
  played: boolean
}

function pick<T>(arr: T[], rng: RNG): T {
  return arr[rng.nextInt(arr.length)]
}

function makeName(rng: RNG): string {
  // Simple deterministic pseudo-name generator using syllables
  const starts = ['Al', 'Be', 'Ca', 'Da', 'El', 'Fi', 'Ga', 'Ha', 'Il', 'Jo', 'Ka', 'Li', 'Mo', 'Na', 'Ol', 'Pa', 'Qi', 'Ra', 'Sa', 'Ta', 'Ul', 'Vi', 'Wi', 'Xa', 'Ya', 'Za']
  const mids = ['la', 'ra', 'na', 'mi', 'ri', 'lo', 'ta', 'sa', 'ne', 'le', 'no', 'ro', 'mo', 'va', 'do', 'fi', 'ki', 'zu', 'ya', 'xo']
  const ends = ['n', 'r', 's', 'l', 'm', 't', 'x', 'y', 'z', 'k', 'd']
  const parts = 2 + (rng.nextInt(100) < 30 ? 1 : 0) // 70% 2 parts, 30% 3 parts
  const first = pick(starts, rng)
  let middle = ''
  if (parts === 3) middle = pick(mids, rng)
  const last = pick(ends, rng)
  // Optionally add a vowel in between
  const vowels = ['a', 'e', 'i', 'o', 'u']
  const maybeVowel = rng.nextInt(100) < 50 ? pick(vowels, rng) : ''
  const base = `${first}${maybeVowel}${middle}${last}`
  // Capitalize first letter already ensured by starts; ensure min length
  return base
}

export function generateUsers(count: number, seed: number): User[] {
  const rng = createXorShift32(seed | 0)
  const users: User[] = []
  const seen = new Set<string>()
  for (let i = 0; i < count; i++) {
    let name = makeName(rng)
    // De-duplicate names by appending a suffix deterministically
    let attempt = 1
    while (seen.has(name)) {
      name = `${name}${attempt}`
      attempt++
    }
    seen.add(name)
    const idNum = i + 1
    const id = `u${idNum.toString().padStart(5, '0')}` // u00001 .. u10000
    users.push({ id, name, played: false })
  }
  return users
}

export function indexUsers(users: User[]): Record<string, User> {
  const idx: Record<string, User> = {}
  for (const u of users) idx[u.id] = u
  return idx
}

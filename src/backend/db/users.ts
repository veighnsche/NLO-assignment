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

// --- Dutch name generator (deterministic) ---

function pickDutchFirstName(rng: RNG): string {
  const firstNames = [
    // Common Dutch male
    'Jan','Pieter','Kees','Henk','Bram','Sven','Daan','Timo','Lars','Tom','Joost','Teun','Willem','Gerrit','Rik','Dirk','Arjan','Niels','Jeroen','Maarten',
    // Common Dutch female
    'Anna','Sanne','Lisa','Julia','Emma','Sophie','Noor','Eva','Fleur','Lotte','Iris','Mila','Lieke','Nina','Roos','Anne','Sara','Femke','Tess','Yara',
    // Neutral / international often seen in NL
    'Max','Noah','Levi','Luca','Mats','Jesse','Robin','Alex','Sam','Jamie'
  ]
  return pick(firstNames, rng)
}

function pickDutchTussenvoegsel(rng: RNG): string | '' {
  // Include empty option more often to avoid every surname having a tussenvoegsel
  const opts = ['', '', '', 'van', 'de', 'van de', 'van der', 'den', 'ter']
  return pick(opts, rng)
}

function pickDutchSurname(rng: RNG): string {
  const surnames = [
    // Very common NL
    'Jansen','De Vries','Janssen','Bakker','Visser','Smit','Meijer','De Boer','Mulder','De Groot','Bos','De Jong','Peters','Hendriks','Van Dijk','Van der Meer','Van Dam','Kuipers','Schouten','Post','Dekker','Van Leeuwen','Van der Veen','Van der Linden','Van der Wal','Brouwer','De Wit','Dijkstra','De Bruin','De Jonge','Willems','Timmermans','Martens','Jacobs','Peeters','Vermeulen','Verhoeven','Kok','Klein','Hoekstra','Smits','Van den Berg','Van den Heuvel','Van den Broek','Van den Bosch','Van den Brink','Van den Berghe',
    // Additional common/Belgian/intl surnames often seen in NL
    'Hermans','Scholten','Sanders','Vos','Maas','Koster','Prins','Verschuren','Groen','Swaanen','Huisman','Kuiper','De Graaf','De Ruiter','De Lange','Gerritsen','Hopman','De Ridder','Kramer','Boon','De Haan','Van Vliet','De Graaff','Verbeek','Scholz','Pieters','Brands','Blom','Vink','Molenaar','Hofman','Postma','Ketels','Hofstra','Cornelissen','Snoek','Bergsma','Koopman','Hendricks','Smeets','Coppens','Jongen','Scholte','Hof','Gerrits','Veenstra','Groeneveld','Veldhuizen','Kooij','Bakkerink','Bastiaans','Mulders','Rutten','Schoenmakers','Kluivers','Meuleman','Daniels','Gielen','Rademaker','Mertens','Pauwels','De Smet','Van Aken'
  ]
  return pick(surnames, rng)
}

function makeDutchFullName(rng: RNG): string {
  // First name with optional compound first name or middle initial
  let first = pickDutchFirstName(rng)
  const compoundChance = rng.nextInt(100) < 20 // 20% hyphenated first (e.g., Jan-Willem)
  if (compoundChance) {
    let second = pickDutchFirstName(rng)
    // Avoid duplicates like Jan-Jan
    if (second === first) {
      second = pickDutchFirstName(rng)
    }
    first = `${first}-${second}`
  } else if (rng.nextInt(100) < 20) {
    // 20% include middle initial
    const initials = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const idx = rng.nextInt(initials.length)
    first = `${first} ${initials[idx]}.`
  }

  // Surname: optional tussenvoegsel and optional hyphenated double surname
  const tv = pickDutchTussenvoegsel(rng)
  let last1 = pickDutchSurname(rng)
  let last2: string | null = null
  if (rng.nextInt(100) < 25) {
    // 25% chance of double-barrelled surname
    last2 = pickDutchSurname(rng)
    if (last2 === last1) last2 = null
  }

  // Normalize spacing and remove duplicate tussenvoegsels from surname entries
  const clean = (s: string) => s.replace(/^(van\s+de\s+|van\s+der\s+|van\s+|de\s+|den\s+|ter\s+)/i, '')
  last1 = clean(last1)
  if (last2) last2 = clean(last2)

  const tvPart = tv ? tv.toLowerCase() + ' ' : ''
  const last = last2 ? `${last1}-${last2}` : last1
  return `${first} ${tvPart}${last}`
}

export function generateDutchUsers(count: number, seed: number): User[] {
  const rng = createXorShift32(seed | 0)
  const users: User[] = []
  const seen = new Set<string>()
  for (let i = 0; i < count; i++) {
    let name = makeDutchFullName(rng)
    // De-duplicate deterministically by suffixing a number if necessary
    let attempt = 1
    while (seen.has(name)) {
      name = `${name} ${attempt}`
      attempt++
    }
    seen.add(name)
    const idNum = i + 1
    const id = `u${idNum.toString().padStart(5, '0')}`
    users.push({ id, name, played: false })
  }
  return users
}

// Barrel re-export for backend DB public API (delegates to services)
export {
  bootDatabase,
  getSnapshotForClient,
  adminReset,
  revealCell,
  botStep,
  getAdminTargets,
} from './services/grid.service'
export { setBotDelayRange, getBotDelayRange } from './services/bot.service'
export {
  getCurrentPlayer,
  setCurrentPlayer,
  listEligibleUsers,
  assignUserForClient,
  resolveUsers,
} from './services/users.service'

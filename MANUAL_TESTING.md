# Manual Testing Guide

This guide helps you manually test the game using the Admin Bar to expose winning cells and validate different states, including winning a consolation prize and the grand prize.

## Prerequisites
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Open the app in your browser (the terminal shows the local URL). In dev, MSW is auto-enabled.

## Enable and use the Admin Bar
- Ensure the Admin Bar is visible. If it’s hidden, use the top toggle button to show it.
- The Admin Bar provides the following controls:
  - "Toon prijzen" / "Verberg prijzen": toggles exposed prizes overlay.
  - "Reset spel…": opens a modal to reset the board with an optional seed.

## Find and test winning cells
1) Show prizes
   - Click "Toon prijzen" in the Admin Bar. Prizes are now exposed on the grid so you can find winning cells.

2) Test a consolation prize
   - With prizes shown, pick any winning cell that is not the grand prize (a smaller/consolation prize) and click it.
   - Verify the UI transitions into the consolation-won state (check prize reveal, messages, and any follow-up prompts/buttons).
   - Optionally, click "Verberg prijzen" to ensure the state remains correct without overlays.

3) Test the grand prize
   - Click "Reset spel…" in the Admin Bar.
   - In the reset modal, leave the Seed field EMPTY, then confirm reset.
     - Tip: If you reset with an empty seed number, the grand prize is in the bottom row (easy to find).
   - Click "Toon prijzen" again to expose prizes.
   - Locate the grand prize in the bottom row and open that cell.
   - Verify the UI transitions into the grand-prize-won state (grand prize visuals/text, any special actions).

## Additional checks
- Toggle between "Toon prijzen" and "Verberg prijzen" to ensure overlays don’t disrupt already-won states.
- Use "Verander van speler" to confirm session/player display changes don’t break the current game state visuals.
- Adjust the bot speed slider to confirm UI remains responsive and doesn’t affect the ability to identify and open winning cells.

## Resetting for another run
- Use "Reset spel…" (with or without a numeric seed) to re-run scenarios. Remember: empty seed places the grand prize on the bottom row.

## Notes
- The Admin Bar is intended for testing/dev only and should not be used in production.
- If the app appears to be initializing, wait for the initial screen to complete before interacting with the grid/admin controls.

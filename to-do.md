# Project TODOs

- [ ] Use a cover image on top of the grid
  - Add an overlay/cover image layer above `CalendarGrid.vue`, toggle visibility as cells reveal or after a sequence.

- [ ] Add margin/padding adjustments
  - Review spacing around `GameSection.vue` and global layout. Consider consistent spacing scale and responsive gutters.

- [ ] Responsiveness (if game changes)
  - Make grid and UI adaptive to different game modes/sizes. Abstract constants, test at mobile/tablet/desktop breakpoints.

- [ ] TopBar refinement
  - Improve `TopBar.vue` layout, actions, and accessibility. Consider sticky behavior and visual polish.

- [ ] Opening cell sequence
  - Define a reveal sequence animation (stagger, highlight path, or celebration). Ensure a11y and performance at 10k grid scale.

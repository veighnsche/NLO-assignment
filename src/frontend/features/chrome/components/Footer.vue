<template>
  <footer class="game-footer" aria-label="Voettekst">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Column 1: Over NLO -->
        <section class="col">
          <h3 class="col-title">Over Nederlandse Loterij</h3>
          <ul class="link-list">
            <li><a href="#" @click.prevent>Klantenservice</a></li>
            <li><a href="#" @click.prevent>Werken bij</a></li>
            <li><a href="#" @click.prevent>Acties</a></li>
            <li><a href="#" @click.prevent>Over ons</a></li>
            <li><a href="#" @click.prevent>Nieuws</a></li>
            <li><a href="#" @click.prevent>Beeldbank</a></li>
            <li><a href="#" @click.prevent>Apps</a></li>
          </ul>
          <div class="social-row" aria-label="Social media">
            <Icon icon="mdi:facebook" />
            <Icon icon="mdi:instagram" />
            <Icon icon="mdi:youtube" />
            <Icon icon="mdi:linkedin" />
          </div>
        </section>

        <!-- Column 2: Reglementen & Beleid -->
        <section class="col">
          <h3 class="col-title">Reglementen & Beleid</h3>
          <ul class="link-list">
            <li><a href="#" @click.prevent>Deelnemersreglement</a></li>
            <li><a href="#" @click.prevent>Verantwoord spelen</a></li>
            <li><a href="#" @click.prevent>Trekkingsprocedures</a></li>
            <li><a href="#" @click.prevent>Gedragscodes</a></li>
            <li><a href="#" @click.prevent>Cookies</a></li>
            <li><a href="#" @click.prevent>Disclaimer</a></li>
            <li><a href="#" @click.prevent>Privacy</a></li>
            <li><a href="#" @click.prevent>Beveiliging</a></li>
            <li><a href="#" @click.prevent>Toegankelijkheid</a></li>
            <li><a href="#" @click.prevent>Vergunningen</a></li>
            <li><a href="#" @click.prevent>Jaarstukken</a></li>
          </ul>
        </section>

        <!-- Column 3: Spellen -->
        <section class="col">
          <h3 class="col-title">Nederlandse Loterij spellen</h3>
          <div class="games-grid" aria-label="Spellen">
            <div class="game-tile" style="--tile: #1e88e5">StateLoterij</div>
            <div class="game-tile" style="--tile: #ef6c00">Krasloten</div>
            <div class="game-tile" style="--tile: #fdd835; color: #111">Lotto</div>
            <div class="game-tile" style="--tile: #43a047">Lucky Day</div>
            <div class="game-tile" style="--tile: #ec407a">Toto</div>
            <div class="game-tile" style="--tile: #7e57c2">Miljoenenspel</div>
          </div>
        </section>

        <!-- Column 4: Goede doelen -->
        <section class="col">
          <h3 class="col-title">Met jouw loten steun je o.a. deze goede doelen:</h3>
          <ul class="charity-list" aria-label="Goede doelen">
            <li class="charity">Hersenstichting</li>
            <li class="charity">Cultuurfonds</li>
            <li class="charity">Brandwonden stichting</li>
            <li class="charity">Hartstichting</li>
          </ul>
        </section>
      </div>

      <div class="certs-row" aria-label="Certificeringen">
        <span class="cert"><Icon icon="mdi:shield-check" /> Veilig spelen</span>
        <span class="cert"><Icon icon="mdi:certificate" /> WLA certified</span>
        <span class="cert"><Icon icon="mdi:account-check" /> Responsible Gaming</span>
      </div>

      <div class="legal-row">
        <small>
          Copyright Nederlandse Loterij 2025. Alle rechten voorbehouden.
          <span class="right">Nog {{ remaining }} van {{ total }} te openen</span>
        </small>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AppFooter' })
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGridStore } from '@/frontend/features/game/store/grid'

const grid = useGridStore()
const total = computed(() => grid.total)
const remaining = computed(() => Math.max(0, grid.total - grid.openedCount))
</script>

<style scoped>
.game-footer {
  margin-top: 16px;
  margin-bottom: 12px; /* overlap handled by App.vue */
  padding: 24px 12px 12px;
  background: var(--surface-elevated);
  color: var(--color-brand-blue, var(--text));
  box-shadow: var(--shadow-sm);
}

.footer-container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding-inline: var(--container-gutter); /* horizontal margins */
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(var(--footer-grid-cols), minmax(0, 1fr));
  gap: 24px 36px;
}

.col-title {
  margin: 0 0 10px;
  font-size: 1.05rem;
  font-weight: 700;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.link-list a {
  color: var(--color-brand-blue, var(--text));
  text-decoration: none;
}

.link-list a:hover,
.link-list a:focus-visible {
  text-decoration: underline;
}

.social-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  color: color-mix(in srgb, var(--color-brand-blue, var(--text)) 85%, black);
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.game-tile {
  background: var(--tile, color-mix(in srgb, var(--surface-contrast) 8%, var(--surface)));
  color: var(--surface-contrast);
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: 6px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.charity-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.charity {
  color: color-mix(in srgb, var(--text) 55%, var(--border-subtle));
}

.certs-row {
  display: flex;
  gap: 16px;
  align-items: center;
  color: color-mix(in srgb, var(--text) 65%, var(--border-subtle));
  margin-top: 22px;
}

.cert {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legal-row {
  margin-top: 12px;
  color: color-mix(in srgb, var(--text) 65%, var(--border-subtle));
  display: flex;
  justify-content: center;
}

.legal-row .right {
  margin-left: 10px;
  color: color-mix(in srgb, var(--text) 55%, var(--border-subtle));
  font-variant-numeric: tabular-nums;
}

/* Column count driven by --footer-grid-cols in breakpoints.css */
</style>

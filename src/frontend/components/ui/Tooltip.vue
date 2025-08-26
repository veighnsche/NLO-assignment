<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  open?: boolean
  x?: number
  y?: number
  placement?: 'top' | 'bottom' | 'left' | 'right'
  offset?: number
  id?: string
  zIndex?: number
  teleport?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  x: 0,
  y: 0,
  placement: 'top',
  offset: 8,
  id: undefined,
  zIndex: 1000,
  teleport: true,
  maxWidth: '240px',
})

// Give the SFC an explicit multi-word name to satisfy the linter rule
defineOptions({
  name: 'UiTooltip',
})

const styleVars = computed(() => {
  return {
    '--tt-left': props.x + 'px',
    '--tt-top': props.y + 'px',
    '--tt-offset': props.offset + 'px',
    '--tt-z': String(props.zIndex),
    '--tt-maxw': props.maxWidth,
  } as Record<string, string>
})

const placementClass = computed(() => `tt-${props.placement}`)
</script>

<template>
  <Teleport to="body" v-if="teleport">
    <div
      v-show="open"
      :id="id"
      role="tooltip"
      :aria-hidden="!open"
      class="tt tooltip"
      :class="placementClass"
      :style="styleVars"
    >
      <slot />
    </div>
  </Teleport>
  <div
    v-else
    v-show="open"
    :id="id"
    role="tooltip"
    :aria-hidden="!open"
    class="tt tooltip"
    :class="placementClass"
    :style="styleVars"
  >
    <slot />
  </div>
</template>

<style scoped>
/* Positioning via CSS variables for speed */
.tt {
  position: fixed;
  left: var(--tt-left);
  top: var(--tt-top);
  z-index: var(--tt-z);
  max-width: var(--tt-maxw);
  pointer-events: none; /* avoids interfering with hover targets */
}

/* Base look */
.tooltip {
  background: rgba(17, 17, 17, 0.95);
  color: #fff;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.2;
  box-shadow: 0 6px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12);
}

/* Arrow */
.tooltip::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  transform: rotate(45deg);
}

/* Placements (translate from mouse x/y) */
.tt-top {
  transform: translate(-50%, calc(-100% - var(--tt-offset)));
}
.tt-top.tooltip::after {
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%) rotate(45deg);
}

.tt-bottom {
  transform: translate(-50%, var(--tt-offset));
}
.tt-bottom.tooltip::after {
  left: 50%;
  top: -4px;
  transform: translateX(-50%) rotate(45deg);
}

.tt-left {
  transform: translate(calc(-100% - var(--tt-offset)), -50%);
}
.tt-left.tooltip::after {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.tt-right {
  transform: translate(var(--tt-offset), -50%);
}
.tt-right.tooltip::after {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}
</style>

<template>
  <button
    class="btn"
    :class="[
      `color-${color}`,
      `variant-${variant}`,
      `size-${size}`,
      { 'is-block': block, 'is-loading': loading, 'is-icon': icon },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    :aria-disabled="disabled || loading ? 'true' : undefined"
  >
    <span class="btn__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
defineOptions({ name: 'UiButton' })

interface Props {
  color?: 'default' | 'primary' | 'success' | 'danger'
  variant?: 'filled' | 'outline' | 'text'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  icon?: boolean
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const { color, variant, size, block, icon, disabled, loading, type } = withDefaults(
  defineProps<Props>(),
  {
    color: 'default',
    variant: 'filled',
    size: 'md',
    block: false,
    icon: false,
    disabled: false,
    loading: false,
    type: 'button',
  },
)
</script>

<style scoped>
/*
  Button component styles
  - Uses component tokens that alias to base tokens from src/styles/theme.css
  - No raw hex values; only CSS variables
*/

.btn {
  /* Map component tokens to internal temporary variables (per-instance) */
  --_bg: var(--btn-bg);
  --_text: var(--btn-text);
  --_border: var(--btn-border);
  --_hover-bg: var(--btn-hover-bg);
  --_shadow: var(--btn-shadow);
  --_radius: var(--btn-radius);
  /* Role color used by outline/text variants */
  --_role-color: var(--text);
  --_role-hover: var(--btn-hover-bg);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  background: var(--_bg);
  color: var(--_text);
  box-shadow: var(--_shadow);
  font: inherit;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    box-shadow 120ms ease,
    transform 50ms ease;
}

.btn:hover:not(:disabled) {
  background: var(--_hover-bg);
}

.btn:active:not(:disabled) {
  transform: translateY(0.5px);
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--btn-focus-ring);
}

.btn:is(:disabled, .is-loading) {
  cursor: not-allowed;
  opacity: 0.7;
}

/* Color sets (map to component tokens) */
.btn.color-default {
  --_bg: var(--btn-bg);
  --_text: var(--btn-text);
  --_border: var(--btn-border);
  --_hover-bg: var(--btn-hover-bg);
  --_shadow: var(--btn-shadow);
  --_role-color: var(--text);
  --_role-hover: var(--btn-hover-bg);
}

.btn.color-primary {
  --_bg: var(--btn-primary-bg);
  --_text: var(--btn-primary-text);
  --_border: var(--btn-primary-border);
  --_hover-bg: var(--btn-primary-hover-bg);
  --_shadow: var(--btn-primary-shadow);
  --_role-color: var(--btn-primary-bg);
  --_role-hover: var(--btn-primary-hover-bg);
}

.btn.color-success {
  --_bg: var(--btn-success-bg);
  --_text: var(--btn-success-text);
  --_border: var(--btn-success-border);
  --_hover-bg: var(--btn-success-hover-bg);
  --_shadow: var(--btn-success-shadow);
  --_role-color: var(--btn-success-bg);
  --_role-hover: var(--btn-success-hover-bg);
}

.btn.color-danger {
  --_bg: var(--btn-danger-bg);
  --_text: var(--btn-danger-text);
  --_border: var(--btn-danger-border);
  --_hover-bg: var(--btn-danger-hover-bg);
  --_shadow: var(--btn-danger-shadow);
  --_role-color: var(--btn-danger-bg);
  --_role-hover: var(--btn-danger-hover-bg);
}

/* Variant styles */
/* Filled (default) uses the mapped color variables as-is */

/* Outline: transparent background, colored text/border; subtle tinted hover */
.btn.variant-outline {
  background: transparent;
  color: var(--_role-color);
  border-color: var(--_role-color);
  box-shadow: none;
}
.btn.variant-outline:hover:not(:disabled) {
  /* subtle tint using color-mix; avoids raw hex */
  background: color-mix(in srgb, var(--_role-color) 12%, transparent);
}

/* Text: no border, transparent background, colored text; gold underline on hover */
.btn.variant-text {
  background: transparent;
  color: var(--_role-color);
  border-color: transparent;
  box-shadow: none;
}
.btn.variant-text:hover:not(:disabled) {
  text-decoration: underline;
  text-decoration-color: var(--link-hover-underline-color);
  background: transparent;
}

/* Sizes */
.btn.size-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
}
.btn.size-md {
  padding: 0.5rem 0.9rem;
  font-size: 1rem;
}
.btn.size-lg {
  padding: 0.7rem 1.1rem;
  font-size: 1.0625rem;
}

/* Block */
.btn.is-block {
  display: inline-flex;
  width: 100%;
}

/* Loading */
.btn.is-loading {
  position: relative;
}
.btn.is-loading .btn__content {
  opacity: 0.85;
}

/* Icon-only */
.btn.is-icon {
  width: 32px;
  height: 32px;
  padding: 0;
}
</style>

<script setup lang="ts">
// A live affordance demo, embeddable in any markdown page. It uses the real
// `@affordant/vue` adapter against the in-browser backend — so the docs
// dogfood the package they document, with nothing to deploy.
import { computed, onMounted, ref, watch } from 'vue'
import { useAffordance, useFollow, type HateoasResource } from '@affordant/vue'
import { createDemoBackend, type Order } from '../../demo/order'

const backend = createDemoBackend()
const base = 'https://orders.demo'

const owner = ref(true)
const order = ref<HateoasResource<Order> | null>(null)

// The caller's identity: `u1` owns the order, `u2` is some other signed-in user.
const token = computed(() => (owner.value ? 'u1' : 'u2'))

async function load() {
  const res = await backend.fetch(`${base}/orders/8f3a2c`, {
    headers: { authorization: `Bearer ${token.value}` },
  })
  order.value = (await res.json()) as HateoasResource<Order>
}

const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()

async function onCancel() {
  if (!cancel.action.value) return
  await run(cancel.action.value, { token: token.value, fetch: backend.fetch })
  await load()
}

async function reset() {
  backend.reset()
  await load()
}

// Reload whenever the caller switches, so the affordance re-evaluates.
watch(owner, load)
onMounted(load)
</script>

<template>
  <div v-if="order" class="aff-demo">
    <div class="aff-controls">
      <label class="aff-toggle">
        <input type="checkbox" v-model="owner" />
        <span>I am the order's owner</span>
      </label>
      <button class="aff-reset" type="button" @click="reset">Reset</button>
    </div>

    <div class="aff-stage">
      <div class="aff-card">
        <div class="aff-card-head">
          <span class="aff-id">Order {{ order.id }}</span>
          <span :class="['aff-badge', `aff-badge-${order.status}`]">{{ order.status }}</span>
        </div>
        <button
          v-if="cancel.can.value"
          class="aff-action"
          type="button"
          :disabled="running"
          @click="onCancel"
        >
          Cancel
        </button>
        <p v-else class="aff-empty">No <code>cancel</code> offered for this caller / state.</p>
      </div>

      <pre class="aff-json"><code>{{ JSON.stringify(order, null, 2) }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.aff-demo {
  margin: 1.25rem 0;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.aff-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}
.aff-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
}
.aff-reset {
  font-size: 0.8rem;
  padding: 0.25rem 0.7rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.aff-reset:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.aff-stage {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}
@media (max-width: 640px) {
  .aff-stage {
    grid-template-columns: 1fr;
  }
}
.aff-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
}
.aff-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.aff-id {
  font-weight: 600;
}
.aff-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.aff-badge-pending {
  color: var(--vp-c-warning-1);
  background: var(--vp-c-warning-soft);
}
.aff-badge-cancelled {
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}
.aff-badge-shipped {
  color: var(--vp-c-success-1);
  background: var(--vp-c-success-soft);
}
.aff-action {
  align-self: flex-start;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  cursor: pointer;
}
.aff-action:disabled {
  opacity: 0.5;
  cursor: progress;
}
.aff-empty {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}
.aff-json {
  margin: 0;
  padding: 0.85rem;
  font-size: 0.78rem;
  line-height: 1.5;
  border-radius: 10px;
  overflow-x: auto;
  background: var(--vp-code-block-bg);
}
.aff-json code {
  background: transparent;
  padding: 0;
}
</style>

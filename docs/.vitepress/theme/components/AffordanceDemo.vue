<script setup lang="ts">
// A focused, single-affordance demo for inline use in the guide. It uses the
// real `@affordant/vue` adapter against the in-browser backend — so the docs
// dogfood the package they document, with nothing to deploy.
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { useAffordance, useFollow, type HateoasResource } from '@affordant/vue'
import { createDemoBackend, type Order } from '../../demo/order'

const backend = createDemoBackend()
const base = 'https://orders.demo'

const { lang } = useData()
const fr = computed(() => lang.value.startsWith('fr'))
const t = computed(() =>
  fr.value
    ? { owner: 'Je suis le propriétaire de la commande', cancel: 'Annuler', none: "Aucun cancel offert pour cet appelant / état.", reset: 'Réinitialiser' }
    : { owner: "I am the order's owner", cancel: 'Cancel', none: 'No cancel offered for this caller / state.', reset: 'Reset' },
)

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

// Body without _actions; the cancel rel is rendered separately (below) so it
// can animate in and out as the server offers or withdraws it.
const bodyJson = computed(() => {
  if (!order.value) return ''
  const { _actions, ...rest } = order.value
  const lines = JSON.stringify(rest, null, 2).split('\n')
  lines.pop() // drop the root "}" — _actions and the close are appended in the template
  lines[lines.length - 1] += ',' // comma after the last body member
  lines.push('') // trailing newline so "_actions" starts on its own line
  return lines.join('\n')
})

// 0 or 1 rel, but an array keeps the template identical to the Playground's.
const offered = computed(() => (cancel.can.value ? ['cancel'] : []))

watch(owner, load)
onMounted(load)
</script>

<template>
  <div v-if="order" class="aff-demo">
    <div class="aff-controls">
      <label class="aff-toggle">
        <input type="checkbox" v-model="owner" />
        <span>{{ t.owner }}</span>
      </label>
      <button class="aff-reset" type="button" @click="reset">{{ t.reset }}</button>
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
          {{ t.cancel }}
        </button>
        <p v-else class="aff-empty">{{ t.none }}</p>
      </div>

      <pre class="aff-json"><code>{{ bodyJson }}  "_actions": {</code><TransitionGroup name="aff-rel" tag="div" class="aff-rels"><div v-for="rel in offered" :key="rel" class="aff-rel"><code>    "{{ rel }}": </code><code class="aff-rel-val">{ "href": "…/{{ rel }}", "method": "POST" }</code></div></TransitionGroup><code>  }
}</code></pre>
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
  align-items: start;
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
.aff-badge-pending { color: var(--vp-c-warning-1); background: var(--vp-c-warning-soft); }
.aff-badge-cancelled { color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.aff-badge-shipped { color: var(--vp-c-success-1); background: var(--vp-c-success-soft); }
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
  white-space: pre;
}
.aff-rels {
  display: block;
}
.aff-rel {
  display: block;
  border-radius: 5px;
  background: var(--vp-c-brand-soft);
}
.aff-rel-val {
  color: var(--vp-c-text-2);
}
.aff-rel-enter-active,
.aff-rel-leave-active {
  transition: all 0.25s ease;
}
.aff-rel-enter-from,
.aff-rel-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>

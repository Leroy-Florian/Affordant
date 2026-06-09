<script setup lang="ts">
// The full Playground: one order moving through its whole lifecycle, with ~a
// dozen affordances gated on state *and* role. Uses the real @affordant/vue
// adapter against the in-browser backend, so the offered action set — and the
// _actions block in the live wire view — shifts as you act and switch roles.
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { follow } from 'affordant'
import type { HateoasResource } from '@affordant/vue'
import { createPlaygroundBackend, type Order, type Role } from '../../demo/playground'

const backend = createPlaygroundBackend()
const base = 'https://orders.demo'

const { lang } = useData()
const fr = computed(() => lang.value.startsWith('fr'))

// rel → human label, per locale. Drives the action buttons.
const REL_LABELS: Record<string, { en: string; fr: string }> = {
  pay: { en: 'Pay', fr: 'Payer' },
  applyCoupon: { en: 'Apply coupon', fr: 'Appliquer un coupon' },
  cancel: { en: 'Cancel', fr: 'Annuler' },
  confirmReceipt: { en: 'Confirm receipt', fr: 'Confirmer la réception' },
  requestReturn: { en: 'Request return', fr: 'Demander un retour' },
  reorder: { en: 'Re-order', fr: 'Commander à nouveau' },
  ship: { en: 'Ship', fr: 'Expédier' },
  markDelivered: { en: 'Mark delivered', fr: 'Marquer livré' },
  refund: { en: 'Refund', fr: 'Rembourser' },
  addNote: { en: 'Add note', fr: 'Ajouter une note' },
  track: { en: 'Track', fr: 'Suivre' },
  invoice: { en: 'Invoice', fr: 'Facture' },
  contactSupport: { en: 'Contact support', fr: 'Contacter le support' },
}

const ROLES: { id: Role; en: string; fr: string }[] = [
  { id: 'customer', en: 'Customer (owner)', fr: 'Client (propriétaire)' },
  { id: 'support', en: 'Support staff', fr: 'Support' },
  { id: 'guest', en: 'Guest', fr: 'Visiteur' },
]

const ui = computed(() =>
  fr.value
    ? {
        role: 'Vous êtes :',
        reset: 'Réinitialiser',
        total: 'Total',
        none: "Aucune affordance pour ce rôle dans cet état.",
        wire: 'Réponse du serveur (le fil)',
      }
    : {
        role: 'You are:',
        reset: 'Reset',
        total: 'Total',
        none: 'No affordance for this role in this state.',
        wire: "Server response (the wire)",
      },
)

const label = (rel: string) => {
  const l = REL_LABELS[rel]
  return l ? (fr.value ? l.fr : l.en) : rel
}

const role = ref<Role>('customer')
const order = ref<HateoasResource<Order> | null>(null)
const busy = ref<string | null>(null)

async function load() {
  const res = await backend.fetch(`${base}/orders/8f3a2c`, {
    headers: { authorization: `Bearer ${role.value}` },
  })
  order.value = (await res.json()) as HateoasResource<Order>
}

// The offered rels, in a stable display order matching the labels map.
const offered = computed(() =>
  order.value ? Object.keys(REL_LABELS).filter((rel) => rel in order.value!._actions) : [],
)

async function act(rel: string) {
  const action = order.value?._actions[rel]
  if (!action) return
  busy.value = rel
  try {
    await follow(action, { token: role.value, fetch: backend.fetch })
    await load()
  } finally {
    busy.value = null
  }
}

async function reset() {
  backend.reset()
  await load()
}

// Pretty-print everything except _actions; that block is rendered separately so
// each rel line can animate in and out as the server offers/withdraws it.
const bodyJson = computed(() => {
  if (!order.value) return ''
  const { _actions, ...rest } = order.value
  const lines = JSON.stringify(rest, null, 2).split('\n')
  lines[lines.length - 1] = lines[lines.length - 1] + ',' // trailing comma before _actions
  return lines.join('\n')
})

watch(role, load)
onMounted(load)
</script>

<template>
  <div v-if="order" class="pg">
    <header class="pg-head">
      <span class="pg-tag">PLAYGROUND</span>
      <div class="pg-roles">
        <span class="pg-roles-label">{{ ui.role }}</span>
        <button
          v-for="r in ROLES"
          :key="r.id"
          type="button"
          :class="['pg-role', { 'pg-role-on': role === r.id }]"
          @click="role = r.id"
        >
          {{ fr ? r.fr : r.en }}
        </button>
      </div>
      <button class="pg-reset" type="button" @click="reset">{{ ui.reset }}</button>
    </header>

    <div class="pg-stage">
      <div class="pg-card">
        <div class="pg-card-head">
          <span class="pg-id">Order {{ order.id }}</span>
          <span :class="['pg-badge', `pg-badge-${order.status}`]">{{ order.status }}</span>
        </div>
        <div class="pg-total">{{ ui.total }}: {{ (order.total / 100).toFixed(2) }} €</div>
        <p v-if="order.lastEvent" class="pg-event">↳ {{ order.lastEvent }}</p>

        <TransitionGroup name="pg-btn" tag="div" class="pg-actions">
          <button
            v-for="rel in offered"
            :key="rel"
            type="button"
            class="pg-action"
            :disabled="busy !== null"
            @click="act(rel)"
          >
            {{ label(rel) }}
          </button>
        </TransitionGroup>
        <p v-if="offered.length === 0" class="pg-empty">{{ ui.none }}</p>
      </div>

      <div class="pg-wire">
        <div class="pg-wire-label">{{ ui.wire }}</div>
        <pre class="pg-json"><code>{{ bodyJson }}</code>  <code>"_actions": {</code><TransitionGroup name="pg-rel" tag="div" class="pg-rels"><div v-for="rel in offered" :key="rel" class="pg-rel"><code>    "{{ rel }}": </code><code class="pg-rel-val">{ "href": "…/{{ rel }}", "method": "{{ order._actions[rel].method }}" }</code></div></TransitionGroup><code>  }
}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pg {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 14px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.pg-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  padding: 0.7rem 1rem;
  background: var(--vp-c-brand-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}
.pg-tag {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--vp-c-brand-1);
}
.pg-roles {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.pg-roles-label {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
}
.pg-role {
  font-size: 0.8rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.pg-role-on {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  font-weight: 600;
}
.pg-reset {
  margin-left: auto;
  font-size: 0.8rem;
  padding: 0.25rem 0.7rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.pg-reset:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.pg-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 1rem;
  padding: 1rem;
  align-items: start;
}
@media (max-width: 720px) {
  .pg-stage {
    grid-template-columns: 1fr;
  }
}
.pg-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
}
.pg-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pg-id {
  font-weight: 600;
}
.pg-total {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
.pg-event {
  margin: 0;
  font-size: 0.8rem;
  color: var(--vp-c-brand-1);
}
.pg-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.pg-badge-pending { color: var(--vp-c-warning-1); background: var(--vp-c-warning-soft); }
.pg-badge-paid { color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.pg-badge-shipped,
.pg-badge-delivered { color: var(--vp-c-success-1); background: var(--vp-c-success-soft); }
.pg-badge-cancelled,
.pg-badge-refunded { color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.pg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.pg-action {
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pg-action:hover:not(:disabled) {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}
.pg-action:disabled {
  opacity: 0.45;
  cursor: progress;
}
.pg-empty {
  margin: 0;
  font-size: 0.83rem;
  color: var(--vp-c-text-3);
}
.pg-wire {
  min-width: 0;
}
.pg-wire-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}
.pg-json {
  margin: 0;
  padding: 0.85rem;
  font-size: 0.76rem;
  line-height: 1.55;
  border-radius: 10px;
  overflow-x: auto;
  background: var(--vp-code-block-bg);
}
.pg-json code {
  background: transparent;
  padding: 0;
  white-space: pre;
}
.pg-rels {
  display: block;
}
.pg-rel {
  display: block;
  border-radius: 5px;
  background: var(--vp-c-brand-soft);
}
.pg-rel-val {
  color: var(--vp-c-text-2);
}
/* The whole point: rels slide in / out as the server offers or withdraws them. */
.pg-rel-enter-active,
.pg-rel-leave-active,
.pg-btn-enter-active,
.pg-btn-leave-active {
  transition: all 0.25s ease;
}
.pg-rel-enter-from,
.pg-rel-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
.pg-btn-enter-from,
.pg-btn-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>

---
layout: home

hero:
  name: Affordant
  text: Atteignez le niveau 3 de REST, des deux côtés du fil
  tagline: L'hypermédia (HATEOAS) est le niveau de maturité REST que la plupart des équipes n'atteignent jamais. Affordant vous y amène — le serveur déclare les actions qu'il propose ; votre UI s'affiche à partir d'elles, sans réimplémenter l'autorisation dans le frontend.
  actions:
    - theme: brand
      text: Démarrer
      link: /fr/guide/getting-started
    - theme: alt
      text: Les paquets
      link: /fr/guide/packages
    - theme: alt
      text: Voir sur GitHub
      link: https://github.com/Leroy-Florian/Affordant

features:
  - title: L'autorisation, exprimée une seule fois
    details: La présence d'un lien encode la permission. Le serveur décide à chaque réponse ; le frontend s'affiche à partir de can() et ne redérive jamais vos règles d'autorisation.
  - title: Un seul contrat, des deux côtés
    details: Le build() du serveur produit exactement ce que le can() du client consomme. Un paquet de types partagé empêche producteur et consommateur de jamais diverger.
  - title: Des cœurs sans dépendances
    details: Le client et le serveur sont de simples fonctions sur de simples données, sans dépendances d'exécution. Des adaptateurs React et Vue optionnels ajoutent des hooks et des composables quand vous en voulez.
---

## L'idée en trente secondes

Votre frontend ne construit jamais d'URL, ne choisit jamais de verbe HTTP, ne duplique jamais une règle d'autorisation. Il pose trois questions :

```ts
import { can, actionFor, follow } from 'affordant'

if (can(order, 'cancel')) {                        // 1. Que me propose le serveur ?
  await follow(actionFor(order, 'cancel')!, {      // 2. Où / comment ?  3. Fais-le.
    token: () => localStorage.getItem('token'),
    body: { reason: 'changed my mind' },
  })
}
```

Si le backend cesse de proposer une action — non autorisé, mauvais état, fonctionnalité désactivée — le bouton disparaît. Aucun déploiement du frontend.

## L'autre côté du fil

Le serveur déclare ces mêmes affordances une seule fois, en conditionnant chacune à l'état faisant autorité. Quand `when` est faux, le rel n'est jamais émis — donc `can()` renvoie faux côté client.

```ts
import { resource } from '@affordant/server'

resource(order)
  .self(route('orders.show', order.id))
  .action('cancel', route('orders.cancel', order.id), {
    method: 'POST',
    when: caller.id === order.ownerId && order.status !== 'shipped',
  })
  .build()
```

Un seul contrat, jamais deux implémentations à garder synchronisées. Voir [les paquets](/fr/guide/packages) pour toute la famille.

# Le contrat du fil

Affordant fonctionne sur une convention simple : le serveur enrichit chaque ressource avec `_self` et `_actions`. Chaque action est `{ href, method, accepts? }`, et la **présence d'un rel encode la permission**.

## L'enveloppe

```jsonc
// GET /orders/8f3a2c — appelant anonyme
{
  "id": "8f3a2c",
  "total": 4200,
  "status": "shipped",
  "_self":    { "href": "/orders/8f3a2c", "method": "GET" },
  "_actions": {
    "track": { "href": "/orders/8f3a2c/tracking", "method": "GET" }
  }
}

// même requête, le propriétaire de la commande → une affordance de plus
  "_actions": {
    "track":  { "href": "...", "method": "GET" },
    "cancel": { "href": "/orders/8f3a2c/cancel", "method": "POST" }
  }
```

Le propriétaire obtient un lien `cancel` ; tous les autres ne l'ont tout simplement pas. Le frontend affiche le bouton d'annulation à partir de la *présence* de ce lien — il ne redérive jamais « cet utilisateur peut-il annuler ? ».

Regardez l'enveloppe changer d'elle-même. Changez d'appelant ci-dessous et le bloc `_actions` gagne ou perd `cancel` — exactement la différence entre les deux réponses ci-dessus, en direct :

<AffordanceDemo />

Pour l'enveloppe complète sur tout un cycle de vie et plusieurs rels, voyez le [Playground](/fr/playground).

## La forme, typée

```ts
type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string // type de média de la requête ; vaut application/json par défaut
}

type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

- **`href`** — où vit l'action. Il provient du routeur du serveur, jamais codé en dur dans le client.
- **`method`** — le verbe HTTP à utiliser. Le client ne le devine pas.
- **`accepts`** — le type de média que l'action attend dans le corps de la requête. Omis, Affordant envoie `application/json`.

## Pourquoi « présence = permission » compte

Un rel est **absent** dès que l'action n'est pas disponible pour *cet* appelant à cet instant :

- non autorisé (mauvais rôle, pas le propriétaire),
- mauvais état (la commande est déjà expédiée, le brouillon est déjà publié),
- fonctionnalité désactivée (flag désactivé, le forfait ne l'inclut pas).

Le client n'a pas besoin de savoir *laquelle* de ces raisons s'applique. Il demande `can(order, 'cancel')` et fait confiance à la réponse. Toute cette logique de branchement reste sur le serveur, là où vit l'état faisant autorité — et la modifier ne requiert jamais de déploiement du frontend.

C'est le **niveau 3** du modèle de maturité de Richardson, vu du côté du consommateur : le client est piloté par les contrôles que le serveur lui remet.

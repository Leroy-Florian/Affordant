# Pourquoi le niveau 3 de REST

La plupart des API qui se disent « RESTful » s'arrêtent au **niveau 2** du [modèle de maturité de Richardson](https://martinfowler.com/articles/richardsonMaturityModel.html) : des ressources avec des URL cohérentes et les bons verbes HTTP. Le niveau 3 — les **contrôles hypermédia (HATEOAS)** — est celui que les équipes délaissent. Cette page expose l'intérêt factuel de franchir ce cap, et ce que cela change dans la manière de construire et d'exploiter vos frontends.

## Les quatre niveaux, en une respiration

- **Niveau 0** — un seul point d'entrée, un seul verbe. Du RPC tunnelé sur HTTP.
- **Niveau 1** — des ressources. `/orders/8f3a2c` plutôt que `/api?do=getOrder`.
- **Niveau 2** — verbes et codes de statut. `GET`, `POST`, `DELETE`, `200`, `404`, `409`.
- **Niveau 3** — contrôles hypermédia. La réponse indique au client *ce qu'il peut faire ensuite* — les transitions disponibles voyagent avec les données.

Les niveaux 0→2 concernent l'adressage et le transport. Le niveau 3 concerne le **contrôle** : le serveur cesse de ne renvoyer que de l'état et se met à renvoyer l'état *plus l'ensemble des actions valides sur celui-ci, ici et maintenant*.

## Pourquoi les équipes s'arrêtent au niveau 2

Parce que le niveau 2 « marche » déjà. Le frontend connaît les gabarits d'URL, connaît les verbes, les code en dur, et livre. Le coût est invisible au début — puis il s'accumule :

- Chaque règle d'autorisation du serveur est **réimplémentée** côté client (« seul le propriétaire peut annuler », « impossible d'annuler une fois expédié »). Deux copies d'une même règle, qui divergent.
- Les routes et les verbes sont **figés dans le frontend**. Renommez ou déplacez un endpoint et vous livrez une version du frontend pour suivre.
- L'UI devine l'état du domaine. Un bouton s'affiche, l'utilisateur clique, le serveur répond `409 Conflict` — le frontend avait un coup de retard sur la réalité.

Ce ne sont pas des bugs dans le code. C'est une conséquence de *l'endroit où vit la connaissance*.

## Le cadrage DDD

En domain-driven design, un agrégat possède ses invariants et sa **machine à états** : la légalité d'une transition dépend de l'état courant de l'agrégat et du rôle de l'appelant. `cancel` est légal sur une commande `pending` appartenant à l'appelant ; il n'a aucun sens sur une commande `shipped`.

Le niveau 2 fait fuiter cette machine à états à travers le fil : le backend l'applique, et le frontend la *redérive* pour décider d'afficher un bouton ou non. Les règles de transition d'un seul agrégat vivent désormais dans deux bases de code, dans deux langages, maintenues par deux équipes.

Le niveau 3 garde la machine à états là où elle doit être. **Une affordance est une transition du domaine, rendue explicite sur le fil.** Le serveur calcule les transitions légales pour *cet* agrégat, dans *cet* état, pour *cet* appelant — et émet exactement celles-là. Le frontend les lit. Le langage ubiquitaire (`cancel`, `publish`, `refund`) voyage sous forme de noms de `rel` au lieu d'être réencodé en branches `if` côté client.

```jsonc
// GET /orders/8f3a2c — une commande pending, appartenant à l'appelant
{
  "id": "8f3a2c",
  "status": "pending",
  "_actions": {
    "cancel": { "href": "/orders/8f3a2c/cancel", "method": "POST" },
    "refund": { "href": "/orders/8f3a2c/refund", "method": "POST" }
  }
}
// une fois expédiée, le même appel omet simplement « cancel » — la transition a disparu
```

Le client ne demande jamais « cette commande est-elle annulable ? ». Il demande « le serveur a-t-il proposé `cancel` ? » — et la réponse fait autorité par construction.

## Ce que cela change pour le frontend

C'est le bénéfice factuel. Franchir le cap du niveau 3 change la façon dont un frontend se construit et se maintient :

- **L'autorisation et les règles métier vivent une seule fois.** La présence d'un lien *est* la permission. Le frontend cesse de porter une seconde copie, divergente, des règles du serveur.
- **Aucune URL ni verbe codé en dur.** `href` et `method` proviennent de la réponse. Remodelez votre routage et les clients suivent sans livraison.
- **L'UI suit l'état du domaine par construction.** Quand une transition devient illégale, le rel disparaît et le contrôle avec lui — plus de boutons obsolètes, bien moins de surprises `409` après le clic.
- **Moins de déploiements frontend.** Les changements d'autorisation, de machine à états et de feature flags deviennent des décisions côté serveur. Le frontend affiche déjà ce qu'on lui donne.
- **Un rayon d'impact réduit.** Un changement backend ne peut plus casser silencieusement une hypothèse du frontend qui n'existe plus — l'hypothèse a été supprimée en même temps que la duplication.

Le compromis est réel mais modeste : les réponses portent un peu plus de métadonnées, et le frontend renonce à *connaître* l'API en échange de la *lire*. En retour, vous supprimez toute une catégorie de bugs de divergence front/back.

## L'API se découvre d'elle-même

Il y a un second bénéfice, au-delà du frontend : l'API devient **auto-descriptive**. Un appelant n'a pas besoin d'une carte hors-bande de tous les endpoints — il récupère une ressource et lit les actions qui y sont attachées. La réponse *est* la documentation de ce qui est possible ensuite.

```jsonc
// GET /orders/8f3a2c
{
  "id": "8f3a2c",
  "status": "pending",
  "_self":    { "href": "/orders/8f3a2c",          "method": "GET" },
  "_actions": {
    "track":  { "href": "/orders/8f3a2c/tracking", "method": "GET" },
    "cancel": { "href": "/orders/8f3a2c/cancel",   "method": "POST" },
    "refund": { "href": "/orders/8f3a2c/refund",   "method": "POST" }
  }
}
```

À partir de ce seul appel, un consommateur — humain ou machine — apprend les transitions disponibles, où chacune se trouve et comment l'invoquer. Aucune spec à récupérer à côté, aucun savoir tribal sur le verbe qui va avec tel endpoint. Suivre un lien, obtenir la ressource suivante, lire *ses* actions, recommencer : on explore l'API par traversée — comme on parcourt un site en suivant des liens plutôt qu'en mémorisant des URL.

C'est un levier concret :

- **L'onboarding se réduit.** Un nouveau développeur frontend lit des réponses réelles, pas une spec séparée déjà potentiellement obsolète.
- **Le contrat ne peut pas mentir.** Les actions vues par un appelant sont calculées depuis l'état réel ; la « documentation » est donc toujours synchronisée avec ce que le serveur acceptera vraiment.
- **Les clients peuvent rester génériques.** Outils, panneaux d'administration et tests peuvent piloter l'API uniquement en suivant les rels, sans coder en dur la table de routage.

## Le parcours utilisateur vit — et se teste — côté serveur

Comme chaque transition est décidée côté serveur, la **séquence** des transitions légales — le parcours utilisateur — y vit aussi. « Une commande `pending` peut être annulée ou remboursée ; une fois `shipped`, il ne reste que `track` » est un fait du backend, pas une propriété émergente du code frontend.

Le parcours devient ainsi **testable à sa source**. On peut vérifier, contre l'état réel, que les bonnes affordances apparaissent et disparaissent à mesure que l'agrégat traverse son cycle de vie :

```ts
// le propriétaire d'une commande pending se voit proposer cancel + refund
const pending = await GET('/orders/8f3a2c', { as: owner })
expect(can(pending, 'cancel')).toBe(true)
expect(can(pending, 'refund')).toBe(true)

// une fois expédiée, la transition cancel a disparu — pour tout le monde
const shipped = await ship(order)
expect(can(shipped, 'cancel')).toBe(false)
expect(can(shipped, 'track')).toBe(true)
```

Une suite de tests qui passe ainsi est une garantie sur le parcours lui-même : chaque état propose exactement les transitions qu'il doit, exactement aux appelants qui doivent les avoir. Le frontend peut faire confiance à ce contrat au lieu de retester les mêmes règles à travers l'UI — la navigation est vérifiée une seule fois, là où vivent les règles.

## Où Affordant intervient

Affordant est la mécanique du niveau 3 des deux côtés du fil, sur [un seul contrat partagé](/fr/guide/wire-contract) :

- [`@affordant/server`](/fr/reference/server) émet les affordances, en conditionnant chaque transition à l'état faisant autorité — là où vos règles métier vivent déjà.
- [`affordant`](/fr/reference/api) les lit côté client : `can` / `actionFor` / `follow`.
- [`@affordant/react`](/fr/reference/react) les enveloppe sous forme de hooks.

On n'adopte pas un framework pour atteindre le niveau 3 — on adopte une convention. Affordant rend simplement cette convention typée, symétrique et difficile à laisser diverger.

## Étapes suivantes

- Voir [le contrat du fil](/fr/guide/wire-contract) pour l'enveloppe exacte.
- Lire [côté serveur](/fr/guide/server-side) pour émettre les affordances depuis l'état faisant autorité.
- Parcourir [l'utilisation avec un framework](/fr/guide/frameworks) pour s'afficher à partir de `can()`.

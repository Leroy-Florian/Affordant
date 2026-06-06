# Les paquets

Affordant est une petite famille dans un unique monorepo npm-workspaces. Ils partagent un seul contrat de fil et restent symétriques de part et d'autre : le serveur construit ce que le client consomme.

![Comment s'imbriquent les paquets Affordant : @affordant/contract alimente le serveur et le client ; @affordant/server construit l'enveloppe _self / _actions, que le client affordant lit ; @affordant/express et @affordant/react se placent respectivement aux côtés du serveur et du client.](/diagrams/packages.svg)

| Paquet | Côté | Dépend de | Ce qu'il fait |
|---|---|---|---|
| [`@affordant/contract`](/fr/reference/contract) | partagé | — | Les types du contrat de fil. Zéro exécution, zéro dépendance. Tout le reste en dépend. |
| [`affordant`](/fr/reference/api) | client | contract | `can` / `actionFor` / `follow`. Zéro dépendance d'exécution — fonctionne partout où `fetch` existe. |
| [`@affordant/react`](/fr/reference/react) | client | contract, affordant, *react* | Adaptateur React : conditionnez l'UI aux affordances et suivez-les avec des hooks. |
| [`@affordant/server`](/fr/reference/server) | serveur | contract | Un constructeur pour l'enveloppe `_self` / `_actions`. Indépendant du framework. |
| `@affordant/express` | serveur | server, *express* | Adaptateur Express : envoie l'enveloppe, construit les URL à partir de la requête. |

Les dépendances en italique sont des dépendances **peer** — vous apportez votre propre React / Express. Le cœur client (`affordant`) et le cœur serveur (`@affordant/server`) ne portent aucune dépendance d'exécution.

## À propos d'Effect (et des autres systèmes d'effets)

`follow` est une simple fonction `async` qui renvoie un `Promise<Response>`. Si vous travaillez avec [Effect](https://effect.website) — ou tout autre système d'effets — vous pouvez l'emballer vous-même en une ligne, par ex. `Effect.tryPromise(() => follow(action, init))`. Affordant reste **compatible avec Effect sans embarquer de dépendance Effect** : l'interopérabilité, c'est à vous de l'ajouter quand vous le voulez, jamais imposée.

## Développer

```sh
npm install        # installe tous les workspaces
npm run build      # construit chaque paquet, contract en premier
npm test           # tests unitaires + suites de démo de bout en bout
npm run typecheck  # vérifie les types de chaque paquet
```

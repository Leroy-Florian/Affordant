# Feuille de route

**Français** · [English](ROADMAP.md)

Affordant est **orienté affordances** : le serveur déclare les actions qu'un appelant peut entreprendre, et la présence d'un rel dans l'enveloppe `_actions` *est* la permission. Le client ne redérive jamais l'autorisation — il s'affiche à partir de ce que le serveur a proposé. Cette feuille de route s'organise autour du maintien de ce principe au fil de l'évolution du contrat, des clients et des adaptateurs.

Cette feuille de route est **indicative, non engageante**. Elle traduit la direction souhaitée et l'ordre qui a du sens ; les priorités évolueront avec l'usage réel et les retours. Les éléments sont regroupés par thème, pas par échéance. Toute contribution sur l'un de ces points est la bienvenue — voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Évolution du contrat

Le contrat de fil (`@affordant/contract`) est l'unique source de vérité dont dépendent les deux côtés. Chaque changement ici se répercute sur le client et le serveur, il avance donc avec prudence.

- [ ] `title` d'action et `labels` lisibles pour qu'un client rende un bouton sans coder le texte en dur.
- [ ] `fields` d'entrée sur les actions (façon HAL-Forms) pour décrire le corps attendu par une action.
- [ ] Gabarits d'URI (RFC 6570) pour les hrefs paramétrés, étendus côté client.
- [ ] Enveloppe de collection : une forme typée pour les listes, plus une enveloppe de pagination (next/prev/first/last comme affordances).
- [ ] Enveloppe d'erreur problem-details (`application/problem+json`, RFC 9457) comme forme d'erreur canonique.

## Client

Le client vanilla `affordant` et son rôle : conditionner l'UI aux affordances et les suivre en toute sécurité.

- [ ] `followJson` typé avec gestion d'erreur de premier ordre (distinguer transport, HTTP et erreurs problem-details).
- [ ] Un utilitaire de rafraîchissement pour recharger une ressource et ses affordances après une mutation.
- [ ] Recettes TanStack Query et SWR (clés de cache depuis `_self`, invalidation depuis les actions suivies).
- [ ] Unions `rel` typées pour que `can(resource, rel)` soit vérifié contre les rels déclarés de la ressource.

## Serveur

Le constructeur `@affordant/server` qui émet l'enveloppe.

- [ ] `when` sous forme de fonction et de `async` (le prédicat peut nécessiter une recherche avant de décider).
- [ ] Un constructeur de collection qui emballe les éléments dans l'enveloppe collection + pagination.
- [ ] Propager `title` et les `fields` d'entrée du constructeur jusqu'au fil.

## Adaptateurs de framework

Des adaptateurs symétriques pour que le contrat soit natif sur chaque pile.

- [ ] Adaptateur Vue (client) — rendu conditionné aux affordances et un composable de suivi.
- [ ] Adaptateur Fastify (serveur).
- [ ] Adaptateur Hono (serveur).
- [ ] Adaptateur NestJS (serveur).
- [ ] Adaptateur Next.js route-handler (serveur, App Router).

## DX & outillage

- [ ] Génération OpenAPI depuis le contrat (ou génération du contrat depuis OpenAPI) pour que les chaînes d'outils existantes consomment les affordances.
- [ ] Un devtools / inspecteur pour visualiser les affordances d'une réponse.
- [ ] Utilitaires de test et fabriques de mocks pour construire des enveloppes dans les tests des deux côtés.

## Projet & qualité

- [ ] Publication sur npm avec un badge de version dans les READMEs.
- [ ] Budget de taille de bundle imposé en CI (le client et le contrat restent minuscules par conception).
- [ ] `CONTRIBUTING` plus les modèles d'issue et de PR (cette PR), tenus à jour à mesure que le projet grandit.

## Séquencement suggéré

Trois vagues souples — l'ordre reflète ce qui débloque le plus de travail en aval, pas des dates fixes.

1. **Fondation du contrat.** `title`/`labels` d'action, `fields` d'entrée, l'enveloppe collection + pagination et la forme d'erreur problem-details. Ce sont les changements de fil sur lesquels tout le reste s'appuie.
2. **Rendre ergonomique.** `followJson` typé et gestion d'erreur, unions `rel` typées, le constructeur de collection côté serveur et la propagation des champs, et les recettes TanStack Query / SWR.
3. **Portée.** Adaptateurs de framework (Vue, Fastify, Hono, NestJS, Next.js), interop OpenAPI, devtools, et la publication npm + budget de taille de bundle.

# Playground

Une commande complète, tout son cycle de vie, qui tourne **dans votre
navigateur** sur les vrais paquets `@affordant/server` et `@affordant/vue` —
aucune API à déployer. La commande parcourt sa machine à états
(`pending → paid → shipped → delivered`, plus `cancelled` / `refunded`), et
**chaque action est conditionnée à l'état *et* au rôle**.

Changez d'identité et agissez sur la commande. Observez les boutons — et le bloc
`_actions` dans le fil en direct à droite — apparaître et disparaître à mesure
que le serveur recalcule les transitions légales pour *cet* état et *cet*
appelant. Rien n'est masqué par du code côté client : une action que vous ne
voyez pas n'a jamais été offerte.

<AffordancePlayground />

## À essayer

- En tant que **client**, `payez` la commande, puis remarquez que `cancel`
  survit jusqu'à `paid` alors que `pay` et `applyCoupon` ont disparu — l'état a
  avancé.
- Passez en **support** : voici `ship`, `refund` et `addNote`, tandis que les
  transitions réservées au client s'effacent. Même commande, autre appelant.
- En **visiteur**, presque tout disparaît : vous pouvez seulement `track` une
  commande expédiée ou `contactSupport`. L'autorisation, *c'est* la présence du
  lien.
- Amenez-la jusqu'à `delivered`, puis `requestReturn` ou `reorder` ; ou
  `remboursez`-la et regardez l'ensemble des actions se réduire à la poignée
  d'un état terminal.

Chacune de ces règles vit à un seul endroit — le `when` du serveur —
[exactement comme le décrit le contrat du fil](/fr/guide/wire-contract). Le
frontend affiche ce qu'on lui donne.

import { defineConfig } from 'vitepress'

// Shared, locale-agnostic theme config (merged into every locale).
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Affordant',
  description:
    'Affordance-first hypermedia (HATEOAS), both sides of the wire. A zero-dependency client, a server-side envelope builder, and React and Vue adapters — all over one shared contract.',
  // Deployed to https://<user>.github.io/Affordant/ — change to '/' for a custom domain.
  base: '/Affordant/',
  cleanUrls: true,
  lastUpdated: true,
  // Mermaid sources / tooling notes, not site pages.
  srcExclude: ['diagrams/**'],
  themeConfig: {
    socialLinks: [{ icon: 'github', link: 'https://github.com/Leroy-Florian/Affordant' }],
    search: {
      provider: 'local',
      options: {
        locales: {
          fr: {
            translations: {
              button: {
                buttonText: 'Rechercher',
                buttonAriaLabel: 'Rechercher',
              },
              modal: {
                displayDetails: 'Afficher les détails',
                resetButtonTitle: 'Réinitialiser la recherche',
                backButtonTitle: 'Fermer la recherche',
                noResultsText: 'Aucun résultat pour',
                footer: {
                  selectText: 'sélectionner',
                  selectKeyAriaLabel: 'entrée',
                  navigateText: 'naviguer',
                  navigateUpKeyAriaLabel: 'flèche haut',
                  navigateDownKeyAriaLabel: 'flèche bas',
                  closeText: 'fermer',
                  closeKeyAriaLabel: 'échap',
                },
              },
            },
          },
        },
      },
    },
    editLink: {
      pattern: 'https://github.com/Leroy-Florian/Affordant/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Florian Leroy',
    },
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Reference', link: '/reference/api' },
          { text: 'npm', link: 'https://www.npmjs.com/package/affordant' },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting started', link: '/guide/getting-started' },
                { text: 'Why REST level 3', link: '/guide/why-level-3' },
                { text: 'The packages', link: '/guide/packages' },
                { text: 'The wire contract', link: '/guide/wire-contract' },
                { text: 'Framework usage', link: '/guide/frameworks' },
                { text: 'Server side', link: '/guide/server-side' },
              ],
            },
          ],
          '/reference/': [
            {
              text: 'Client',
              items: [
                { text: 'affordant', link: '/reference/api' },
                { text: '@affordant/react', link: '/reference/react' },
                { text: '@affordant/vue', link: '/reference/vue' },
              ],
            },
            {
              text: 'Server',
              items: [{ text: '@affordant/server', link: '/reference/server' }],
            },
            {
              text: 'Shared',
              items: [{ text: '@affordant/contract', link: '/reference/contract' }],
            },
          ],
        },
      },
    },
    fr: {
      label: 'Français',
      lang: 'fr-FR',
      description:
        "Hypermédia orienté affordances (HATEOAS), des deux côtés du fil. Un client sans dépendances, un constructeur d'enveloppe côté serveur et des adaptateurs React et Vue — le tout sur un contrat partagé.",
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/fr/guide/getting-started' },
          { text: 'Référence', link: '/fr/reference/api' },
          { text: 'npm', link: 'https://www.npmjs.com/package/affordant' },
        ],
        sidebar: {
          '/fr/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Démarrage', link: '/fr/guide/getting-started' },
                { text: 'Pourquoi le niveau 3 de REST', link: '/fr/guide/why-level-3' },
                { text: 'Les paquets', link: '/fr/guide/packages' },
                { text: 'Le contrat du fil', link: '/fr/guide/wire-contract' },
                { text: 'Utilisation avec un framework', link: '/fr/guide/frameworks' },
                { text: 'Côté serveur', link: '/fr/guide/server-side' },
              ],
            },
          ],
          '/fr/reference/': [
            {
              text: 'Client',
              items: [
                { text: 'affordant', link: '/fr/reference/api' },
                { text: '@affordant/react', link: '/fr/reference/react' },
                { text: '@affordant/vue', link: '/fr/reference/vue' },
              ],
            },
            {
              text: 'Serveur',
              items: [{ text: '@affordant/server', link: '/fr/reference/server' }],
            },
            {
              text: 'Partagé',
              items: [{ text: '@affordant/contract', link: '/fr/reference/contract' }],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/Leroy-Florian/Affordant/edit/main/docs/:path',
          text: 'Modifier cette page sur GitHub',
        },
        docFooter: { prev: 'Page précédente', next: 'Page suivante' },
        outline: { label: 'Sur cette page' },
        lastUpdated: { text: 'Dernière mise à jour' },
        langMenuLabel: 'Changer de langue',
        returnToTopLabel: 'Retour en haut',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Apparence',
        lightModeSwitchTitle: 'Passer au thème clair',
        darkModeSwitchTitle: 'Passer au thème sombre',
        footer: {
          message: 'Publié sous licence MIT.',
          copyright: 'Copyright © 2026 Florian Leroy',
        },
      },
    },
  },
})

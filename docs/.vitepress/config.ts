import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Affordant',
  description:
    'Affordance-first hypermedia (HATEOAS), both sides of the wire. A shared contract, a zero-dependency client, a server-side envelope builder, and React / Effect declinations.',
  // Deployed to https://<user>.github.io/Affordant/ — change to '/' for a custom domain.
  base: '/Affordant/',
  cleanUrls: true,
  lastUpdated: true,
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
            { text: 'The packages', link: '/guide/packages' },
            { text: 'The wire contract', link: '/guide/wire-contract' },
            { text: 'Invokers: Promise & Effect', link: '/guide/invokers' },
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
            { text: '@affordant/effect', link: '/reference/effect' },
            { text: '@affordant/react', link: '/reference/react' },
          ],
        },
        {
          text: 'Server',
          items: [{ text: '@affordant/server', link: '/reference/server' }],
        },
        {
          text: 'Shared',
          items: [
            { text: '@affordant/contract', link: '/reference/contract' },
            { text: 'effect-react-bridge', link: '/reference/effect-react-bridge' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Leroy-Florian/Affordant' }],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/Leroy-Florian/Affordant/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Florian Leroy',
    },
  },
})

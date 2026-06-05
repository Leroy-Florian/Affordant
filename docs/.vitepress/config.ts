import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Affordant',
  description:
    'Affordance-first hypermedia (HATEOAS) client. Zero-dependency core: read the actions the server offers, gate your UI on them, follow them.',
  // Deployed to https://<user>.github.io/Affordant/ — change to '/' for a custom domain.
  base: '/Affordant/',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/reference/api' },
      { text: 'npm', link: 'https://www.npmjs.com/package/affordant' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'The wire contract', link: '/guide/wire-contract' },
            { text: 'Framework usage', link: '/guide/frameworks' },
            { text: 'Server side', link: '/guide/server-side' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [{ text: 'API', link: '/reference/api' }],
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

import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import AffordanceDemo from './components/AffordanceDemo.vue'
import AffordancePlayground from './components/AffordancePlayground.vue'

// Extend the stock VitePress theme: register interactive demo components so
// any markdown page can drop `<AffordanceDemo />` or `<AffordancePlayground />`
// inline next to the prose.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AffordanceDemo', AffordanceDemo)
    app.component('AffordancePlayground', AffordancePlayground)
  },
} satisfies Theme

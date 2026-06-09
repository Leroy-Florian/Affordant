import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import AffordanceDemo from './components/AffordanceDemo.vue'

// Extend the stock VitePress theme: register interactive demo components so
// any markdown page can drop `<AffordanceDemo />` inline next to the prose.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AffordanceDemo', AffordanceDemo)
  },
} satisfies Theme

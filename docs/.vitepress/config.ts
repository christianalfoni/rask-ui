import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'RASK',
  description: 'A lightweight reactive component library that combines the simplicity of observable state management with the full power of a virtual DOM reconciler',

  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Get Started', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Slides', link: '/slides/' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Why RASK', link: '/guide/why-rask' },
          { text: 'Core Concepts', link: '/guide/core-concepts' },
          { text: 'TypeScript Support', link: '/guide/typescript' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/api/' },
          { text: 'Core Functions', link: '/api/core' },
          { text: 'Reactivity', link: '/api/reactivity' },
          { text: 'Lifecycle', link: '/api/lifecycle' },
          { text: 'Context', link: '/api/context' },
          { text: 'Async Data', link: '/api/async' },
          { text: 'Error Handling', link: '/api/error-handling' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/rask-ui' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present'
    }
  }
})

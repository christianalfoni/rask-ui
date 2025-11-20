import { defineConfig } from "vitepress";

export default defineConfig({
  title: "RASK",
  description:
    "A lightweight reactive component library that combines the simplicity of observable state management with the full power of a virtual DOM reconciler",

  head: [["link", { rel: "icon", href: "/logo.png" }]],

  themeConfig: {
    logo: "/logo.png",

    nav: [
      { text: "Home", link: "/" },
      { text: "Get Started", link: "/guide/getting-started" },
      { text: "API Reference", link: "/api/" },
      { text: "Slides", link: "/slides/", target: "_self" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Why RASK", link: "/guide/why-rask" },
          { text: "Core Concepts", link: "/guide/core-concepts" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "Overview", link: "/api/" },
          { text: "Components", link: "/api/components" },
          { text: "render", link: "/api/render" },
        ],
      },
      {
        text: "Reactive Hooks",
        items: [
          { text: "useState", link: "/api/useState" },
          { text: "useEffect", link: "/api/useEffect" },
          { text: "useComputed", link: "/api/useComputed" },
          { text: "useAsync", link: "/api/useAsync" },
          { text: "useView", link: "/api/useView" },
          { text: "useRouter", link: "/api/useRouter" },
        ],
      },
      {
        text: "Context & Lifecycle",
        items: [
          { text: "createContext", link: "/api/createContext" },
          { text: "useMountEffect", link: "/api/useMountEffect" },
          { text: "useCleanup", link: "/api/useCleanup" },
          { text: "createRef", link: "/api/createRef" },
        ],
      },
      {
        text: "Other APIs",
        items: [
          { text: "ErrorBoundary", link: "/api/ErrorBoundary" },
          { text: "inspect", link: "/api/inspect" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/christianalfoni/rask-ui" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025-present",
    },
  },
});

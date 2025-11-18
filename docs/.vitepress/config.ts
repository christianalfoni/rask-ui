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
          { text: "Components", link: "/api/components" },
          { text: "render", link: "/api/render" },
          { text: "createState", link: "/api/createState" },
          { text: "createView", link: "/api/createView" },
          { text: "createRef", link: "/api/createRef" },
          { text: "createEffect", link: "/api/createEffect" },
          { text: "createComputed", link: "/api/createComputed" },
          { text: "createMountEffect", link: "/api/createMountEffect" },
          { text: "createCleanup", link: "/api/createCleanup" },
          { text: "createContext", link: "/api/createContext" },
          { text: "createTask", link: "/api/createTask" },
          { text: "createRouter", link: "/api/createRouter" },
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

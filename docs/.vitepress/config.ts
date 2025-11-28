import { defineConfig } from "vitepress";

export default defineConfig({
  title: "RASK",
  description:
    "A lightweight reactive component library that combines the simplicity of observable state management with the full power of a virtual DOM reconciler",

  head: [["link", { rel: "icon", href: "/logo.png" }]],

  // Syntax highlighting configuration matching commit-js
  markdown: {
    theme: {
      light: {
        // Custom light theme with light background and dark text
        name: "commit-light",
        type: "light",
        colors: {
          "editor.background": "#f9fafb", // gray-50 - light background
          "editor.foreground": "#1f2937", // gray-800 - dark text
        },
        tokenColors: [
          {
            scope: ["comment"],
            settings: {
              foreground: "#9ca3af", // gray-400
              fontStyle: "italic",
            },
          },
          {
            scope: ["keyword", "storage.type", "storage.modifier"],
            settings: {
              foreground: "#0369a1", // sky-700 - deep blue
            },
          },
          {
            scope: [
              "entity.name.function",
              "support.function",
              "meta.function-call",
            ],
            settings: {
              foreground: "#6d28d9", // violet-700 - deep violet
            },
          },
          {
            scope: ["variable.parameter", "meta.parameters", "variable.other"],
            settings: {
              foreground: "#be185d", // pink-700 - deep pink
            },
          },
          {
            scope: ["string", "string.quoted"],
            settings: {
              foreground: "#047857", // emerald-700 - deep emerald
            },
          },
          {
            scope: ["constant.numeric", "constant.language", "constant.other"],
            settings: {
              foreground: "#047857", // emerald-700
            },
          },
          {
            scope: ["punctuation"],
            settings: {
              foreground: "#4b5563", // gray-600
            },
          },
          {
            scope: ["entity.name.tag", "support.class.component"],
            settings: {
              foreground: "#0369a1", // sky-700
            },
          },
        ],
      },
      dark: {
        // Custom dark theme matching commit-js shiki tokens
        name: "commit-dark",
        type: "dark",
        colors: {
          "editor.background": "#111827", // gray-900
          "editor.foreground": "#e5e7eb", // gray-200
        },
        tokenColors: [
          {
            scope: ["comment"],
            settings: {
              foreground: "#6b7280", // gray-500
              fontStyle: "italic",
            },
          },
          {
            scope: ["keyword", "storage.type", "storage.modifier"],
            settings: {
              foreground: "#7dd3fc", // sky-300
            },
          },
          {
            scope: [
              "entity.name.function",
              "support.function",
              "meta.function-call",
            ],
            settings: {
              foreground: "#c4b5fd", // violet-300
            },
          },
          {
            scope: ["variable.parameter", "meta.parameters", "variable.other"],
            settings: {
              foreground: "#f9a8d4", // pink-300
            },
          },
          {
            scope: ["string", "string.quoted"],
            settings: {
              foreground: "#6ee7b7", // emerald-300
            },
          },
          {
            scope: ["constant.numeric", "constant.language", "constant.other"],
            settings: {
              foreground: "#6ee7b7", // emerald-300
            },
          },
          {
            scope: ["punctuation"],
            settings: {
              foreground: "#e5e7eb", // gray-200
            },
          },
          {
            scope: ["entity.name.tag", "support.class.component"],
            settings: {
              foreground: "#7dd3fc", // sky-300
            },
          },
        ],
      },
    },
    codeTransformers: [],
  },

  themeConfig: {
    logo: "/logo.png",

    nav: [
      { text: "Home", link: "/" },
      { text: "Get Started", link: "/guide/getting-started" },
      { text: "API Reference", link: "/api/components" },
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
          { text: "createContext", link: "/api/createContext" },
          { text: "inspect", link: "/api/inspect" },
        ],
      },
      {
        text: "Reactive Hooks",
        items: [
          { text: "useState", link: "/api/useState" },
          { text: "useEffect", link: "/api/useEffect" },
          { text: "useDerived", link: "/api/useDerived" },
        ],
      },
      {
        text: "Async Hooks",
        items: [
          { text: "useAsync", link: "/api/useAsync" },
          { text: "useAction", link: "/api/useAction" },
          { text: "useSuspend", link: "/api/useSuspend" },
        ],
      },
      {
        text: "Lifecycle Hooks",
        items: [
          { text: "useMountEffect", link: "/api/useMountEffect" },
          { text: "useCleanup", link: "/api/useCleanup" },
        ],
      },
      {
        text: "Other Hooks",
        items: [
          { text: "useView", link: "/api/useView" },
          { text: "useRef", link: "/api/useRef" },
          { text: "useCatchError", link: "/api/useCatchError" },
          { text: "useRouter", link: "/api/useRouter" },
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

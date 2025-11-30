import { createRequire } from "module";
import type { Plugin } from "vite";

const require = createRequire(import.meta.url);

export interface RaskPluginOptions {
  /**
   * The import source to use for rask-ui imports
   * Defaults to "rask-ui"
   * In tests, you might want to use ".." to point to source files
   */
  importSource?: string;
}

/**
 * Vite plugin for transforming JSX to Inferno with rask-ui/transformer imports
 */
export default function raskPlugin(options: RaskPluginOptions = {}): Plugin {
  const importSource = options.importSource || "rask-ui";
  // Resolve the path to swc-plugin-inferno WASM file
  const infernoPluginPath = require.resolve(
    "swc-plugin-inferno/swc_plugin_inferno.wasm"
  );

  return {
    name: "rask-plugin",
    enforce: "pre",

    config(config, { mode }) {
      return {
        resolve: {
          alias: {
            // In development mode, use Inferno's development build to avoid the warning
            ...(mode === "development" && {
              inferno: "inferno/dist/index.dev.mjs",
            }),
          },
        },
      };
    },

    async transform(code: string, id: string) {
      // Only transform .tsx and .jsx files
      if (!/\.[tj]sx$/.test(id)) {
        return null;
      }

      // Use SWC for transformation
      const swc = await import("@swc/core");

      // First, run the inferno plugin to transform JSX
      const result = await swc.transform(code, {
        filename: id,
        jsc: {
          parser: {
            syntax: id.endsWith(".tsx") ? "typescript" : "ecmascript",
            tsx: id.endsWith(".tsx"),
            jsx: id.endsWith(".jsx"),
          },
          target: "es2020",
          experimental: {
            plugins: [
              // Inferno JSX transformation
              [
                infernoPluginPath,
                {
                  defineAllArguments: false,
                },
              ],
            ],
          },
        },
        sourceMaps: true,
      });

      // Then, replace inferno imports with rask-ui/transformer
      const transformedCode = result.code.replace(
        /from\s+(['"])inferno\1/g,
        `from $1${importSource}/transformer$1`
      );

      return {
        code: transformedCode,
        map: result.map,
      };
    },
  };
}

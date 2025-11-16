import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import type { Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export interface RaskPluginOptions {
  /**
   * Enable transformation of function components to RaskComponent classes
   * @default true
   */
  transformComponents?: boolean;

  /**
   * Import source for Inferno JSX runtime functions
   * @default "rask-ui"
   */
  importSource?: string;

  /**
   * Whether to define all arguments for createVNode/createComponentVNode
   * @default false
   */
  defineAllArguments?: boolean;
}

/**
 * Vite plugin for transforming JSX to Inferno and function components to RaskComponent classes
 */
export default function raskPlugin(options: RaskPluginOptions = {}): Plugin {
  const {
    transformComponents = true,
    importSource = 'rask-ui',
    defineAllArguments = false,
  } = options;

  // Resolve the path to swc-plugin-inferno WASM file
  const infernoPluginPath = require.resolve('swc-plugin-inferno/swc_plugin_inferno.wasm');

  // Resolve the path to our RaskComponent plugin
  const componentPluginPath = path.resolve(
    __dirname,
    '../swc-plugin/target/wasm32-wasip1/release/swc_plugin_rask_component.wasm'
  );

  return {
    name: 'rask-plugin',
    enforce: 'pre',

    config(config, { mode }) {
      return {
        esbuild: false, // Disable esbuild to use SWC
        resolve: {
          alias: {
            // In development mode, use Inferno's development build to avoid the warning
            ...(mode === 'development' && {
              inferno: 'inferno/dist/index.dev.mjs',
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
      const swc = await import('@swc/core');

      const plugins: any[] = [
        // 1. FIRST: Inferno JSX transformation
        [
          infernoPluginPath,
          {
            importSource,
            defineAllArguments,
          },
        ],
      ];

      // 2. SECOND: RaskComponent transformation (if enabled)
      if (transformComponents) {
        plugins.push([
          componentPluginPath,
          {
            importSource,
          },
        ]);
      }

      const result = await swc.transform(code, {
        filename: id,
        jsc: {
          parser: {
            syntax: id.endsWith('.tsx') ? 'typescript' : 'ecmascript',
            tsx: id.endsWith('.tsx'),
            jsx: id.endsWith('.jsx'),
          },
          target: 'es2020',
          experimental: {
            plugins,
          },
        },
        sourceMaps: true,
      });

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}

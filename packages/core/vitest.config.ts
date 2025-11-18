import { defineConfig } from "vitest/config";
import raskPlugin from "./src/plugin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    raskPlugin({
      // In tests, use relative path to source files instead of package name
      importSource: "..",
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
  resolve: {
    alias: {
      // Use Inferno's development build to avoid warnings in tests
      inferno: path.resolve(
        __dirname,
        "./node_modules/inferno/dist/index.dev.mjs"
      ),
    },
  },
});

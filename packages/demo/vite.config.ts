import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { raskPlugin } from "rask-ui/plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [raskPlugin(), react(), tailwindcss()],
  server: {
    port: 3000,
  },
});

import { defineConfig } from "tsup";
import { injectCssPlugin } from "./script/tsup-plugin-inject-css";

export default defineConfig({
  entryPoints: {
    paragraph: "./src/paragraph",
  },
  format: ["cjs", "esm", "iife"],
  target: "esnext",
  minify: true,
  sourcemap: false,
  clean: true,
  legacyOutput: true,
  plugins: [injectCssPlugin()],
});
